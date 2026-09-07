import { webMethod, Permissions } from "wix-web-module";
import { createHash, randomBytes } from "crypto";
import { sbInsert, sbSelect, sbUpdate, eq, and, order } from "backend/supabaseClient";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";

const BOOKINGS = "altea_bookings";
const PASSENGERS = "altea_passengers";
const HISTORY = "altea_pnr_history";
const DOCUMENTS = "altea_booking_documents";
const COMPONENTS = "altea_booking_components";
const INVENTORY = "inventory_master_entities";
const REQUIREMENTS = "travel_requirements";
const AGENTS = "agent_users";

const clean = (v, max = 2000) => String(v ?? "").trim().slice(0, max);
const upper = (v, max = 2000) => clean(v, max).toUpperCase();
const lower = (v, max = 2000) => clean(v, max).toLowerCase();
const safeArray = v => Array.isArray(v) ? v : [];
const nowIso = () => new Date().toISOString();
const isUuid = v => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v || ""));

function publicError(code, message) {
  const error = new Error(message);
  error.code = code;
  error.publicMessage = message;
  return error;
}

function sessionProfile(session = {}) {
  const p = session.profile || session.staff || session.user || session.data?.profile || {};
  return {
    skId: upper(p.skId || p.sk_id || p.employeeId || p.employee_id, 40),
    email: lower(p.email || p.loginEmail, 254),
    name: clean(p.name || p.displayName || p.display_name || p.fullName || p.email, 160),
    possibleAgentId: p.agentUserId || p.agent_user_id || p.agentId || ""
  };
}

async function requireActor() {
  const session = await getStaffPortalSession();
  if (!session || session.ok === false || session.authorized === false || session.loggedIn === false) {
    throw publicError("AUTH_REQUIRED", "ALTEA requires an authorized staff session.");
  }
  const p = sessionProfile(session);
  let rows = [];
  if (isUuid(p.possibleAgentId)) {
    rows = await sbSelect(AGENTS, `select=id,sk_id,email,active,authorized,portal_access,can_manage&${eq("id", p.possibleAgentId)}&limit=1`);
  }
  if ((!rows || !rows.length) && p.skId) {
    rows = await sbSelect(AGENTS, `select=id,sk_id,email,active,authorized,portal_access,can_manage&${eq("sk_id", p.skId)}&limit=1`);
  }
  if ((!rows || !rows.length) && p.email) {
    rows = await sbSelect(AGENTS, `select=id,sk_id,email,active,authorized,portal_access,can_manage&${eq("email", p.email)}&limit=1`);
  }
  const actor = rows?.[0];
  if (!actor || actor.active === false || actor.authorized === false || actor.portal_access === false) {
    throw publicError("AUTH_REQUIRED", "Your staff account is not authorized for ALTEA.");
  }
  return {
    id: actor.id,
    skId: actor.sk_id || p.skId,
    email: actor.email || p.email,
    name: p.name || actor.email || actor.sk_id,
    canManage: actor.can_manage === true
  };
}

function routeFromOrder(order = {}) {
  const slices = safeArray(order.slices);
  const first = slices[0];
  const last = slices[slices.length - 1];
  const origin = first?.origin?.iataCode || first?.segments?.[0]?.origin?.iataCode || "";
  const destination = last?.destination?.iataCode || last?.segments?.[Math.max((last?.segments?.length||1)-1,0)]?.destination?.iataCode || "";
  const firstSegment = first?.segments?.[0];
  const lastSegment = last?.segments?.[Math.max((last?.segments?.length||1)-1,0)];
  return {
    origin: upper(origin, 3),
    destination: upper(destination, 3),
    departureDate: clean(firstSegment?.departingAt, 40).slice(0, 10) || null,
    returnDate: slices.length > 1 ? (clean(lastSegment?.departingAt, 40).slice(0, 10) || null) : null
  };
}

function bookingPublic(row = {}) {
  return {
    id: row.id,
    bookingReference: row.booking_reference || "",
    pnrLocator: row.pnr_locator || "",
    supplier: row.supplier || "SKANDI",
    supplierOrderId: row.supplier_order_id || "",
    supplierBookingReference: row.supplier_booking_reference || "",
    supplierOfferId: row.supplier_offer_id || "",
    productType: row.product_type || "",
    bookingType: row.booking_type || "",
    status: row.status || "",
    paymentStatus: row.payment_status || "",
    fulfillmentStatus: row.fulfillment_status || "",
    ticketingStatus: row.ticketing_status || "",
    origin: row.origin || "",
    destination: row.destination || "",
    departureDate: row.departure_date || null,
    returnDate: row.return_date || null,
    currency: row.currency || "",
    totalAmount: Number(row.total_amount || 0),
    taxAmount: Number(row.tax_amount || 0),
    customerName: row.customer_name || "",
    customerEmail: row.customer_email || "",
    assignedAgentUserId: row.assigned_agent_user_id || null,
    payload: row.payload || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function passengerPublic(row = {}) {
  return {
    id: row.id,
    bookingId: row.booking_id,
    passengerRef: row.passenger_ref || "",
    supplierPassengerId: row.supplier_passenger_id || "",
    paxType: row.pax_type || "ADT",
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    displayName: row.display_name || "",
    gender: row.gender || "",
    dateOfBirth: row.date_of_birth || null,
    nationality: row.nationality || "",
    passportLast4: row.passport_last4 || "",
    apisStatus: row.apis_status || "not_started",
    documentStatus: row.document_status || "not_checked",
    checkinStatus: row.checkin_status || "not_checked_in",
    seatNumber: row.seat_number || "",
    sequenceNumber: row.sequence_number || "",
    payload: row.payload || {},
    updatedAt: row.updated_at
  };
}

function documentPublic(row = {}) {
  return {
    id: row.id,
    bookingId: row.booking_id,
    passengerId: row.passenger_id || null,
    provider: row.provider || "SKANDI",
    providerDocumentId: row.provider_document_id || "",
    documentType: row.document_type || "DOCUMENT",
    documentNumber: row.document_number || "",
    status: row.status || "ACTIVE",
    payload: row.payload || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function historyPublic(row = {}) {
  return {
    id: row.id,
    bookingId: row.booking_id || null,
    pnrLocator: row.pnr_locator || "",
    supplier: row.supplier || "",
    command: row.command || "",
    eventType: row.event_type || "",
    payload: row.payload || {},
    createdAt: row.created_at
  };
}

function componentPublic(row = {}) {
  return {
    id: row.id,
    bookingId: row.booking_id,
    componentType: row.component_type || "SERVICE",
    supplier: row.supplier || "SKANDI",
    sourceEntityId: row.source_entity_id || null,
    supplierReference: row.supplier_reference || "",
    title: row.title || "Service",
    status: row.status || "SELECTED",
    quantity: Number(row.quantity || 1),
    currency: row.currency || "",
    unitAmount: Number(row.unit_amount || 0),
    totalAmount: Number(row.total_amount || 0),
    payload: row.payload || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function inventoryPublic(row = {}) {
  const commercial = row.commercial || {};
  const details = row.details || {};
  return {
    id: row.id,
    publicId: row.public_id || "",
    entityType: row.entity_type || "",
    code: row.code || "",
    name: row.name || "",
    slug: row.slug || "",
    supplierEntityId: row.supplier_entity_id || null,
    parentEntityId: row.parent_entity_id || null,
    currency: upper(commercial.currency || "USD", 3),
    publicPrice: Number(commercial.publicPrice || 0),
    priceBasis: clean(commercial.priceBasis, 50),
    city: clean(details.city || details.destinationName, 160),
    destinationId: details.destinationId || details.areaId || row.parent_entity_id || null,
    category: clean(details.category || details.skandiTier || details.propertyType, 100),
    details
  };
}

function makeBookingReference() {
  const stamp = new Date().toISOString().slice(2,10).replace(/-/g, "");
  return `SK${stamp}${randomBytes(3).toString("hex").toUpperCase()}`;
}

async function loadBookingRow(query) {
  const q = clean(query, 160);
  if (!q) return null;
  const candidates = [
    ["id", q, isUuid(q)],
    ["booking_reference", upper(q, 40), true],
    ["pnr_locator", upper(q, 40), true],
    ["supplier_order_id", q, true],
    ["supplier_booking_reference", upper(q, 40), true]
  ];
  for (const [field, value, enabled] of candidates) {
    if (!enabled) continue;
    const rows = await sbSelect(BOOKINGS, `select=*&${eq(field, value)}&limit=1`);
    if (rows?.[0]) return rows[0];
  }
  return null;
}

async function workspaceForBooking(row) {
  if (!row?.id) return null;
  const [passengers, documents, components, history] = await Promise.all([
    sbSelect(PASSENGERS, `select=*&${eq("booking_id", row.id)}&${order("created_at", "asc")}&limit=50`),
    sbSelect(DOCUMENTS, `select=*&${eq("booking_id", row.id)}&${order("created_at", "asc")}&limit=100`),
    sbSelect(COMPONENTS, `select=*&${eq("booking_id", row.id)}&${order("created_at", "asc")}&limit=200`),
    sbSelect(HISTORY, `select=*&${eq("booking_id", row.id)}&${order("created_at", "desc")}&limit=200`)
  ]);
  return {
    booking: bookingPublic(row),
    passengers: (passengers || []).map(passengerPublic),
    documents: (documents || []).map(documentPublic),
    components: (components || []).map(componentPublic),
    history: (history || []).map(historyPublic)
  };
}

async function appendHistoryInternal(actor, booking, eventType, payload = {}, command = "") {
  const safePayload = payload && typeof payload === "object" ? payload : {};
  const rows = await sbInsert(HISTORY, {
    booking_id: booking?.id || null,
    pnr_locator: booking?.pnr_locator || booking?.supplier_booking_reference || null,
    supplier: booking?.supplier || null,
    command: clean(command, 100) || null,
    event_type: upper(eventType, 80) || "NOTE",
    before_state: null,
    after_state: null,
    payload: safePayload,
    created_by_agent_user_id: actor.id,
    created_at: nowIso()
  });
  return rows?.[0] || null;
}

async function syncPassenger(actor, bookingId, passenger, index) {
  const supplierPassengerId = clean(passenger?.id, 100);
  const firstName = clean(passenger?.givenName || passenger?.given_name, 100);
  const lastName = clean(passenger?.familyName || passenger?.family_name, 100);
  const docs = safeArray(passenger?.identityDocuments || passenger?.identity_documents);
  const passport = docs.find(d => lower(d?.type, 30) === "passport");
  const passportNumber = clean(passport?.uniqueIdentifier || passport?.unique_identifier, 80);
  const passportHash = passportNumber ? createHash("sha256").update(passportNumber).digest("hex") : null;
  const passportLast4 = passportNumber ? passportNumber.slice(-4) : null;
  let existing = [];
  if (supplierPassengerId) {
    existing = await sbSelect(PASSENGERS, `select=*&${and(eq("booking_id", bookingId), eq("supplier_passenger_id", supplierPassengerId))}&limit=1`);
  }
  const patch = {
    booking_id: bookingId,
    passenger_ref: clean(passenger?.passengerRef, 50) || `PAX-${index + 1}`,
    supplier_passenger_id: supplierPassengerId || null,
    pax_type: upper(passenger?.paxType || passenger?.type || "ADT", 20) === "ADULT" ? "ADT" : upper(passenger?.paxType || "ADT", 20),
    first_name: firstName || null,
    last_name: lastName || null,
    display_name: [firstName, lastName].filter(Boolean).join(" ") || null,
    gender: upper(passenger?.gender, 10) || null,
    date_of_birth: clean(passenger?.bornOn || passenger?.born_on, 10) || null,
    nationality: upper(passenger?.nationality, 3) || null,
    ...(passportHash ? { passport_hash: passportHash, passport_last4: passportLast4 } : {}),
    apis_status: passportNumber ? "captured" : "not_started",
    document_status: passportNumber ? "pending_check" : "not_checked",
    payload: {
      email: lower(passenger?.email, 254),
      phone: clean(passenger?.phoneNumber || passenger?.phone_number, 30),
      passportIssuingCountry: upper(passport?.issuingCountryCode || passport?.issuing_country_code, 2),
      passportExpiresOn: clean(passport?.expiresOn || passport?.expires_on, 10)
    },
    updated_at: nowIso()
  };
  if (existing?.[0]) {
    await sbUpdate(PASSENGERS, eq("id", existing[0].id), patch);
  } else {
    await sbInsert(PASSENGERS, { ...patch, created_at: nowIso() });
  }
}

async function syncDocuments(bookingId, order = {}) {
  const docs = safeArray(order.documents);
  for (const doc of docs) {
    const providerId = clean(doc.id, 120) || clean(doc.uniqueIdentifier, 120);
    const filter = providerId ? and(eq("provider", "DUFFEL"), eq("provider_document_id", providerId)) : "";
    const existing = filter ? await sbSelect(DOCUMENTS, `select=*&${filter}&limit=1`) : [];
    const patch = {
      booking_id: bookingId,
      provider: "DUFFEL",
      provider_document_id: providerId || null,
      document_type: upper(doc.type || "AIR_DOCUMENT", 60),
      document_number: clean(doc.uniqueIdentifier, 120) || null,
      status: "ACTIVE",
      payload: { passengerIds: safeArray(doc.passengerIds) },
      updated_at: nowIso()
    };
    if (existing?.[0]) await sbUpdate(DOCUMENTS, eq("id", existing[0].id), patch);
    else await sbInsert(DOCUMENTS, { ...patch, created_at: nowIso() });
  }
}

export const getAlteaUnifiedBootstrap = webMethod(Permissions.SiteMember, async () => {
  const actor = await requireActor();
  const [bookings, requirements, inventory] = await Promise.all([
    sbSelect(BOOKINGS, `select=*&${order("updated_at", "desc")}&limit=100`),
    sbSelect(REQUIREMENTS, `select=id,title,slug,category,body,image_url,active,sort_order,payload,updated_at&active=eq.true&${order("sort_order", "asc")}&limit=200`),
    sbSelect(INVENTORY, `select=id,public_id,entity_type,code,name,slug,supplier_entity_id,parent_entity_id,commercial,details&status=eq.PUBLISHED&active=eq.true&staff_visible=eq.true&entity_type=in.(HOTEL,GUIDED_TOUR,ACTIVITY,PARTNER_TICKET,TRANSFER,CAR_RENTAL,PACKAGE,ANCILLARY)&order=sort_priority.asc,name.asc&limit=500`)
  ]);
  return {
    actor: { skId: actor.skId, name: actor.name, canManage: actor.canManage },
    bookings: (bookings || []).map(bookingPublic),
    requirements: requirements || [],
    inventory: (inventory || []).map(inventoryPublic),
    supplierModel: "DUFFEL + SKANDI",
    regulatoryProvider: "SKANDI_CONTENT_ONLY"
  };
});

export const searchAlteaBookings = webMethod(Permissions.SiteMember, async (input = {}) => {
  await requireActor();
  const rows = await sbSelect(BOOKINGS, `select=*&${order("updated_at", "desc")}&limit=250`);
  const q = clean(input.query, 160).toLowerCase();
  const filtered = q ? (rows || []).filter(row => [
    row.booking_reference, row.pnr_locator, row.supplier_order_id, row.supplier_booking_reference,
    row.customer_name, row.customer_email, row.origin, row.destination, row.status
  ].join(" ").toLowerCase().includes(q)) : (rows || []);
  return { bookings: filtered.slice(0, Math.min(Math.max(Number(input.limit || 100), 1), 250)).map(bookingPublic) };
});

export const getAlteaBookingWorkspace = webMethod(Permissions.SiteMember, async (input = {}) => {
  await requireActor();
  const row = await loadBookingRow(input.bookingId || input.bookingReference || input.supplierOrderId || input.query);
  if (!row) throw publicError("BOOKING_NOT_FOUND", "No ALTEA booking matches that reference.");
  return { workspace: await workspaceForBooking(row) };
});

export const syncDuffelOrderToAltea = webMethod(Permissions.SiteMember, async (input = {}) => {
  const actor = await requireActor();
  const orderData = input.order && typeof input.order === "object" ? input.order : null;
  if (!orderData?.id) throw publicError("DUFFEL_ORDER_REQUIRED", "A Duffel order is required for ALTEA sync.");
  const supplierOrderId = clean(orderData.id, 140);
  const supplierBookingReference = upper(orderData.bookingReference, 40);
  let existing = await sbSelect(BOOKINGS, `select=*&${and(eq("supplier", "DUFFEL"), eq("supplier_order_id", supplierOrderId))}&limit=1`);
  const route = routeFromOrder(orderData);
  const bookingInput = input.bookingInput && typeof input.bookingInput === "object" ? input.bookingInput : {};
  const passengers = safeArray(bookingInput.passengers);
  const firstPassenger = passengers[0] || {};
  const customerName = [clean(firstPassenger.givenName, 100), clean(firstPassenger.familyName, 100)].filter(Boolean).join(" ");
  const ticketingStatus = safeArray(orderData.documents).length ? "issued" : (orderData.status === "confirmed" ? "awaiting_documents" : "pending");
  const patch = {
    booking_reference: supplierBookingReference || (existing?.[0]?.booking_reference || null),
    pnr_locator: supplierBookingReference || (existing?.[0]?.pnr_locator || null),
    supplier: "DUFFEL",
    supplier_order_id: supplierOrderId,
    supplier_booking_reference: supplierBookingReference || null,
    supplier_offer_id: clean(bookingInput.offerId || orderData.offerId, 140) || null,
    payment_reference: clean(bookingInput.paymentIntentId, 140) || existing?.[0]?.payment_reference || null,
    ticketing_status: ticketingStatus,
    booking_type: "AIR",
    product_type: "FLIGHT_ONLY",
    customer_email: lower(firstPassenger.email, 254) || existing?.[0]?.customer_email || null,
    customer_name: customerName || existing?.[0]?.customer_name || null,
    status: lower(orderData.status || "confirmed", 40),
    payment_status: orderData.type === "hold" ? "unpaid" : "paid",
    fulfillment_status: orderData.status === "confirmed" ? "confirmed" : lower(orderData.status || "pending", 40),
    origin: route.origin || null,
    destination: route.destination || null,
    departure_date: route.departureDate,
    return_date: route.returnDate,
    currency: upper(orderData.totalCurrency, 3) || null,
    total_amount: Number(orderData.totalAmount || 0),
    tax_amount: Number(orderData.taxAmount || 0),
    source_page: "ALTEA_UNIFIED",
    source_channel: "riaintra-altea",
    created_by_agent_user_id: existing?.[0]?.created_by_agent_user_id || actor.id,
    assigned_agent_user_id: existing?.[0]?.assigned_agent_user_id || actor.id,
    payload: {
      ...(existing?.[0]?.payload || {}),
      supplierType: orderData.type || null,
      availableActions: safeArray(orderData.availableActions),
      selectedServiceIds: safeArray(bookingInput.services).map(s => clean(s?.id, 120)).filter(Boolean),
      syncedAt: nowIso()
    },
    updated_at: nowIso()
  };
  let booking;
  if (existing?.[0]) {
    const rows = await sbUpdate(BOOKINGS, eq("id", existing[0].id), patch);
    booking = rows?.[0] || { ...existing[0], ...patch };
  } else {
    const rows = await sbInsert(BOOKINGS, { ...patch, created_at: nowIso() });
    booking = rows?.[0];
  }
  if (!booking?.id) throw publicError("ALTEA_SYNC_FAILED", "The airline order was created but ALTEA could not create its internal booking record.");
  for (let index = 0; index < passengers.length; index += 1) {
    await syncPassenger(actor, booking.id, passengers[index], index);
  }
  await syncDocuments(booking.id, orderData);
  await appendHistoryInternal(actor, booking, input.eventType || "SUPPLIER_SYNC", {
    supplierOrderId,
    supplierBookingReference,
    orderStatus: orderData.status || "",
    documentCount: safeArray(orderData.documents).length
  });
  return { workspace: await workspaceForBooking(booking) };
});

export const updateAlteaPassenger = webMethod(Permissions.SiteMember, async (input = {}) => {
  const actor = await requireActor();
  const passengerId = clean(input.passengerId, 80);
  if (!isUuid(passengerId)) throw publicError("PASSENGER_REQUIRED", "Select a passenger first.");
  const rows = await sbSelect(PASSENGERS, `select=*&${eq("id", passengerId)}&limit=1`);
  const current = rows?.[0];
  if (!current) throw publicError("PASSENGER_NOT_FOUND", "Passenger not found.");
  const patchInput = input.patch && typeof input.patch === "object" ? input.patch : {};
  const patch = {
    first_name: clean(patchInput.firstName, 100) || current.first_name,
    last_name: clean(patchInput.lastName, 100) || current.last_name,
    display_name: clean(patchInput.displayName, 200) || [clean(patchInput.firstName, 100) || current.first_name, clean(patchInput.lastName, 100) || current.last_name].filter(Boolean).join(" "),
    gender: upper(patchInput.gender, 10) || current.gender,
    date_of_birth: clean(patchInput.dateOfBirth, 10) || current.date_of_birth,
    nationality: upper(patchInput.nationality, 3) || current.nationality,
    apis_status: lower(patchInput.apisStatus, 40) || current.apis_status,
    document_status: lower(patchInput.documentStatus, 40) || current.document_status,
    checkin_status: lower(patchInput.checkinStatus, 40) || current.checkin_status,
    seat_number: upper(patchInput.seatNumber, 10) || null,
    sequence_number: upper(patchInput.sequenceNumber, 20) || null,
    payload: { ...(current.payload || {}), operationalNote: clean(patchInput.operationalNote, 1000) },
    updated_at: nowIso()
  };
  const updatedRows = await sbUpdate(PASSENGERS, eq("id", passengerId), patch);
  const bookingRows = await sbSelect(BOOKINGS, `select=*&${eq("id", current.booking_id)}&limit=1`);
  const booking = bookingRows?.[0];
  await appendHistoryInternal(actor, booking, "PASSENGER_UPDATED", {
    passengerId,
    apisStatus: patch.apis_status,
    documentStatus: patch.document_status,
    checkinStatus: patch.checkin_status,
    seatNumber: patch.seat_number
  });
  return { passenger: passengerPublic(updatedRows?.[0] || { ...current, ...patch }), workspace: booking ? await workspaceForBooking(booking) : null };
});

export const addAlteaHistoryNote = webMethod(Permissions.SiteMember, async (input = {}) => {
  const actor = await requireActor();
  const row = await loadBookingRow(input.bookingId || input.bookingReference || input.query);
  if (!row) throw publicError("BOOKING_NOT_FOUND", "Select a booking first.");
  const note = clean(input.note, 2000);
  if (!note) throw publicError("NOTE_REQUIRED", "Enter a note.");
  await appendHistoryInternal(actor, row, input.eventType || "AGENT_NOTE", { note }, input.command || "");
  return { workspace: await workspaceForBooking(row) };
});

export const updateAlteaDocumentStatus = webMethod(Permissions.SiteMember, async (input = {}) => {
  const actor = await requireActor();
  const documentId = clean(input.documentId, 80);
  if (!isUuid(documentId)) throw publicError("DOCUMENT_REQUIRED", "Select a document first.");
  const rows = await sbSelect(DOCUMENTS, `select=*&${eq("id", documentId)}&limit=1`);
  const current = rows?.[0];
  if (!current) throw publicError("DOCUMENT_NOT_FOUND", "Document not found.");
  const status = upper(input.status, 40) || current.status;
  const updatedRows = await sbUpdate(DOCUMENTS, eq("id", documentId), { status, updated_at: nowIso() });
  const bookingRows = await sbSelect(BOOKINGS, `select=*&${eq("id", current.booking_id)}&limit=1`);
  const booking = bookingRows?.[0];
  await appendHistoryInternal(actor, booking, "DOCUMENT_STATUS_UPDATED", { documentId, status });
  return { document: documentPublic(updatedRows?.[0] || { ...current, status }), workspace: booking ? await workspaceForBooking(booking) : null };
});


export const createAlteaLocalBooking = webMethod(Permissions.SiteMember, async (input = {}) => {
  const actor = await requireActor();
  const bookingReference = makeBookingReference();
  const currency = upper(input.currency || "USD", 3);
  if (!/^[A-Z]{3}$/.test(currency)) throw publicError("INVALID_CURRENCY", "Use a three-letter currency code.");
  const rows = await sbInsert(BOOKINGS, {
    booking_reference: bookingReference,
    pnr_locator: null,
    supplier: "SKANDI",
    booking_type: "LOCAL",
    product_type: "MIXED_PACKAGE",
    status: "draft",
    payment_status: "unpaid",
    fulfillment_status: "pending",
    ticketing_status: "not_applicable",
    customer_name: clean(input.customerName, 200) || null,
    customer_email: lower(input.customerEmail, 254) || null,
    currency,
    total_amount: 0,
    tax_amount: 0,
    source_page: "ALTEA_UNIFIED",
    source_channel: "riaintra-altea",
    created_by_agent_user_id: actor.id,
    assigned_agent_user_id: actor.id,
    payload: { notes: clean(input.notes, 2000), localDraft: true },
    created_at: nowIso(),
    updated_at: nowIso()
  });
  const booking = rows?.[0];
  if (!booking?.id) throw publicError("BOOKING_CREATE_FAILED", "The SKANDI booking file could not be created.");
  await appendHistoryInternal(actor, booking, "LOCAL_BOOKING_CREATED", { bookingReference });
  return { workspace: await workspaceForBooking(booking) };
});

export const addAlteaInventoryComponent = webMethod(Permissions.SiteMember, async (input = {}) => {
  const actor = await requireActor();
  const bookingId = clean(input.bookingId, 80);
  const entityId = clean(input.entityId, 80);
  if (!isUuid(bookingId) || !isUuid(entityId)) throw publicError("COMPONENT_INPUT_INVALID", "Select a booking and an Inventory Control product.");
  const [bookingRows, entityRows] = await Promise.all([
    sbSelect(BOOKINGS, `select=*&${eq("id", bookingId)}&limit=1`),
    sbSelect(INVENTORY, `select=id,public_id,entity_type,code,name,supplier_entity_id,parent_entity_id,commercial,details,status,active,staff_visible&${eq("id", entityId)}&limit=1`)
  ]);
  const booking = bookingRows?.[0];
  const entity = entityRows?.[0];
  if (!booking) throw publicError("BOOKING_NOT_FOUND", "The selected booking no longer exists.");
  if (!entity || entity.status !== "PUBLISHED" || entity.active === false || entity.staff_visible === false) {
    throw publicError("INVENTORY_NOT_AVAILABLE", "The selected Inventory Control product is not available for staff booking.");
  }
  const quantity = Math.min(Math.max(Number(input.quantity || 1), 1), 99);
  const commercial = entity.commercial || {};
  const unitAmount = Math.max(Number(commercial.publicPrice || 0), 0);
  const currency = upper(commercial.currency || booking.currency || "USD", 3);
  const existing = await sbSelect(COMPONENTS, `select=*&${and(eq("booking_id", bookingId), eq("source_entity_id", entityId))}&limit=1`);
  const patch = {
    booking_id: bookingId,
    component_type: entity.entity_type,
    supplier: "SKANDI",
    source_entity_id: entityId,
    supplier_reference: entity.public_id || entity.code || null,
    title: entity.name,
    status: "SELECTED",
    quantity,
    currency,
    unit_amount: unitAmount,
    total_amount: Math.round(unitAmount * quantity * 100) / 100,
    payload: {
      inventoryPublicId: entity.public_id || "",
      inventoryCode: entity.code || "",
      destinationId: entity.details?.destinationId || entity.details?.areaId || entity.parent_entity_id || null,
      priceBasis: commercial.priceBasis || "",
      selectedAt: nowIso()
    },
    created_by_agent_user_id: existing?.[0]?.created_by_agent_user_id || actor.id,
    updated_at: nowIso()
  };
  if (existing?.[0]) await sbUpdate(COMPONENTS, eq("id", existing[0].id), patch);
  else await sbInsert(COMPONENTS, { ...patch, created_at: nowIso() });
  await appendHistoryInternal(actor, booking, "BOOKING_COMPONENT_SELECTED", { entityId, entityType: entity.entity_type, title: entity.name, quantity, currency, unitAmount });
  return { workspace: await workspaceForBooking(booking) };
});

export const updateAlteaBookingComponent = webMethod(Permissions.SiteMember, async (input = {}) => {
  const actor = await requireActor();
  const componentId = clean(input.componentId, 80);
  if (!isUuid(componentId)) throw publicError("COMPONENT_REQUIRED", "Select a booking component first.");
  const rows = await sbSelect(COMPONENTS, `select=*&${eq("id", componentId)}&limit=1`);
  const current = rows?.[0];
  if (!current) throw publicError("COMPONENT_NOT_FOUND", "The booking component was not found.");
  const allowedStatuses = new Set(["SELECTED","REQUESTED","CONFIRMED","CANCELLED","REMOVED"]);
  const status = upper(input.status || current.status, 40);
  if (!allowedStatuses.has(status)) throw publicError("INVALID_COMPONENT_STATUS", "The component status is invalid.");
  const quantity = Math.min(Math.max(Number(input.quantity || current.quantity || 1), 1), 99);
  const patch = {
    status,
    quantity,
    total_amount: Math.round(Number(current.unit_amount || 0) * quantity * 100) / 100,
    updated_at: nowIso()
  };
  const updatedRows = await sbUpdate(COMPONENTS, eq("id", componentId), patch);
  const bookingRows = await sbSelect(BOOKINGS, `select=*&${eq("id", current.booking_id)}&limit=1`);
  const booking = bookingRows?.[0];
  await appendHistoryInternal(actor, booking, "BOOKING_COMPONENT_UPDATED", { componentId, status, quantity });
  return { component: componentPublic(updatedRows?.[0] || { ...current, ...patch }), workspace: booking ? await workspaceForBooking(booking) : null };
});

export const createAlteaPassenger = webMethod(Permissions.SiteMember, async (input = {}) => {
  const actor = await requireActor();
  const bookingId = clean(input.bookingId, 80);
  if (!isUuid(bookingId)) throw publicError("BOOKING_REQUIRED", "Select a SKANDI booking first.");
  const bookingRows = await sbSelect(BOOKINGS, `select=*&${eq("id", bookingId)}&limit=1`);
  const booking = bookingRows?.[0];
  if (!booking) throw publicError("BOOKING_NOT_FOUND", "The selected booking no longer exists.");
  if (upper(booking.supplier, 20) !== "SKANDI") {
    throw publicError("SUPPLIER_PASSENGER_CONTROLLED", "Passengers on a Duffel airline order must be changed through a supplier-supported servicing action, not by adding an internal-only traveler.");
  }
  const firstName = clean(input.firstName, 100);
  const lastName = clean(input.lastName, 100);
  if (!firstName || !lastName) throw publicError("PASSENGER_NAME_REQUIRED", "Enter the passenger first and last name.");
  const paxType = upper(input.paxType || "ADT", 20);
  if (!new Set(["ADT","CHD","INF","YTH","SEN"]).has(paxType)) throw publicError("INVALID_PASSENGER_TYPE", "Choose a valid passenger type.");
  const existing = await sbSelect(PASSENGERS, `select=id&${eq("booking_id", bookingId)}&limit=100`);
  const passengerRef = `PAX-${String((existing || []).length + 1).padStart(3, "0")}`;
  const rows = await sbInsert(PASSENGERS, {
    booking_id: bookingId,
    passenger_ref: passengerRef,
    pax_type: paxType,
    first_name: firstName,
    last_name: lastName,
    display_name: `${firstName} ${lastName}`,
    gender: upper(input.gender, 10) || null,
    date_of_birth: clean(input.dateOfBirth, 10) || null,
    nationality: upper(input.nationality, 3) || null,
    apis_status: "not_started",
    document_status: "not_checked",
    checkin_status: "not_checked_in",
    payload: {
      email: lower(input.email, 254),
      phone: clean(input.phone, 30),
      localPassenger: true
    },
    created_at: nowIso(),
    updated_at: nowIso()
  });
  const passenger = rows?.[0];
  await appendHistoryInternal(actor, booking, "PASSENGER_ADDED", { passengerId: passenger?.id || null, passengerRef, paxType });
  return { passenger: passengerPublic(passenger), workspace: await workspaceForBooking(booking) };
});
