import { getSecret } from "wix-secrets-backend";
import { fetch } from "wix-fetch";

const SUPABASE_URL_SECRET = "SUPABASE_URL";
const SUPABASE_SERVICE_ROLE_SECRET = "SUPABASE_SERVICE_ROLE_KEY";

let configCache = null;

async function getSupabaseConfig() {
  if (configCache?.url && configCache?.key) {
    return configCache;
  }

  const url = String(await getSecret(SUPABASE_URL_SECRET) || "").replace(/\/$/, "");
  const key = String(await getSecret(SUPABASE_SERVICE_ROLE_SECRET) || "").trim();

  if (!url || !key) {
    throw new Error("Supabase secrets are missing.");
  }

  configCache = { url, key };
  return configCache;
}

export async function supabaseRequest(path, options = {}) {
  const { url, key } = await getSupabaseConfig();

  const response = await fetch(`${url}/rest/v1/${String(path).replace(/^\//, "")}`, {
    method: options.method || "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error_description ||
      data?.error ||
      `Supabase request failed: ${response.status}`;

    throw new Error(message);
  }

  return data;
}

function cleanText(value, max = 255) {
  return String(value || "").trim().slice(0, max);
}

function cleanUpper(value, max = 20) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, max);
}

function cleanDate(value) {
  const text = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function cleanTime(value) {
  const text = String(value || "").trim();
  return /^\d{2}:\d{2}(:\d{2})?$/.test(text) ? text : null;
}

function money(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function intValue(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function boolValue(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function filtersOf(input = {}) {
  return {
    ...(input.filters || {}),
    ...input
  };
}

function addEq(params, column, value) {
  const v = cleanText(value);
  if (v) {
    params.push(`${column}=eq.${encodeURIComponent(v)}`);
  }
}

function addDateEq(params, column, value) {
  const v = cleanDate(value);
  if (v) {
    params.push(`${column}=eq.${encodeURIComponent(v)}`);
  }
}

function addIlike(params, column, value) {
  const v = cleanText(value);
  if (v) {
    params.push(`${column}=ilike.*${encodeURIComponent(v)}*`);
  }
}

function buildPath(table, params = []) {
  return `${table}?${params.join("&")}`;
}

function mapFlightLeg(row = {}) {
  if (!row?.id) return null;

  return {
    id: row.id,
    flightNumber: row.flight_number || "",
    departureDate: row.departure_date || "",
    boardPoint: row.board_point || "",
    offPoint: row.off_point || "",
    equipmentType: row.equipment_type || "",
    physicalCapacity: row.physical_capacity || 0,
    yieldIndex: row.yield_index || "",
    controlMode: row.control_mode || "",
    revenueBand: row.revenue_band || "",
    status: row.status || "",
    source: row.source || "postgres",
    lastSyncAt: row.last_sync_at || "",
    payload: row.payload || {},
    updatedAt: row.updated_at || ""
  };
}

function mapFlightClass(row = {}) {
  return {
    id: row.id || "",
    flightLegId: row.flight_leg_id || "",
    flightNumber: row.flight_number || "",
    departureDate: row.departure_date || "",
    boardPoint: row.board_point || "",
    offPoint: row.off_point || "",
    classCode: row.class_code || "",
    cabin: row.cabin || "",
    nest: row.nest || "",
    authorized: row.authorized || 0,
    sold: row.sold || 0,
    available: row.available || 0,
    waitlistLimit: row.waitlist_limit || 0,
    overbookingLimit: row.overbooking_limit || 0,
    protection: row.protection || 0,
    status: row.status || "open",
    note: row.note || "",
    payload: row.payload || {},
    updatedAt: row.updated_at || ""
  };
}

function mapSchedule(row = {}) {
  return {
    id: row.id || "",
    seasonCode: row.season_code || "",
    flightNumber: row.flight_number || "",
    daysOfOperation: row.days_of_operation || "",
    boardPoint: row.board_point || "",
    offPoint: row.off_point || "",
    viaPoint: row.via_point || "",
    std: row.std || "",
    sta: row.sta || "",
    equipmentType: row.equipment_type || "",
    capacity: row.capacity || 0,
    effectiveDate: row.effective_date || "",
    discontinueDate: row.discontinue_date || "",
    status: row.status || "draft",
    payload: row.payload || {},
    updatedAt: row.updated_at || ""
  };
}

function mapNesting(row = {}) {
  return {
    id: row.id || "",
    flightNumber: row.flight_number || "",
    departureDate: row.departure_date || "",
    boardPoint: row.board_point || "",
    offPoint: row.off_point || "",
    classCode: row.class_code || "",
    cabin: row.cabin || "",
    nest: row.nest || "",
    parentClass: row.parent_class || "",
    bidPrice: row.bid_price || 0,
    hurdle: row.hurdle || 0,
    minStay: row.min_stay || "",
    waitlistLimit: row.waitlist_limit || 0,
    overbookingLimit: row.overbooking_limit || 0,
    authorized: row.authorized || 0,
    protection: row.protection || 0,
    waitlistPolicy: row.waitlist_policy || "CLASS",
    status: row.status || "open",
    payload: row.payload || {},
    updatedAt: row.updated_at || ""
  };
}

function mapHotel(row = {}) {
  return {
    id: row.hotel_id || "",
    rowId: row.id || "",
    hotelId: row.hotel_id || "",
    hotelName: row.hotel_name || "",
    destination: row.destination || "",
    date: row.allocation_date || "",
    roomType: row.room_type || "",
    block: row.room_block || 0,
    sold: row.sold || 0,
    netRate: row.net_rate || 0,
    publicRate: row.public_rate || 0,
    currency: row.currency || "USD",
    status: row.status || "open",
    blackout: Boolean(row.blackout),
    imageUrl: row.image_url || "",
    note: row.note || "",
    payload: row.payload || {},
    updatedAt: row.updated_at || ""
  };
}

function mapTour(row = {}) {
  return {
    id: row.tour_id || "",
    rowId: row.id || "",
    tourId: row.tour_id || "",
    name: row.activity_name || "",
    activityName: row.activity_name || "",
    destination: row.destination || "",
    date: row.service_date || "",
    startTime: row.start_time || "",
    capacity: row.capacity || 0,
    sold: row.sold || 0,
    adultPrice: row.adult_price || 0,
    childPrice: row.child_price || 0,
    currency: row.currency || "USD",
    guide: row.guide || "",
    status: row.status || "open",
    imageUrl: row.image_url || "",
    note: row.note || "",
    payload: row.payload || {},
    updatedAt: row.updated_at || ""
  };
}

function mapTicket(row = {}) {
  return {
    id: row.id || "",
    vendor: row.vendor || "",
    ticketId: row.ticket_id || "",
    product: row.product_name || "",
    productName: row.product_name || "",
    destination: row.destination || "",
    date: row.service_date || "",
    held: row.held || 0,
    sold: row.sold || 0,
    netRate: row.net_rate || 0,
    retailRate: row.retail_rate || 0,
    currency: row.currency || "USD",
    lastSync: row.last_sync_at || "",
    status: row.sync_status || "pending",
    apiReference: row.api_reference || "",
    payload: row.payload || {},
    updatedAt: row.updated_at || ""
  };
}

function mapProduct(row = {}, components = []) {
  return {
    id: row.id || "",
    sku: row.product_id || "",
    productId: row.product_id || "",
    productType: row.product_type || "package",
    title: row.title || "",
    destination: row.destination || "",
    startDate: row.start_date || "",
    endDate: row.end_date || "",
    basePrice: row.base_price || 0,
    livePrice: row.live_price || 0,
    marginPct: row.margin_pct || 0,
    currency: row.currency || "USD",
    availabilityStatus: row.availability_status || "available",
    supplierSource: row.supplier_source || "mixed",
    customerVisible: Boolean(row.customer_visible),
    staffVisible: Boolean(row.staff_visible),
    alteaVisible: Boolean(row.altea_visible),
    bookingFlow: row.booking_flow || "package",
    status: row.status || "draft",
    imageUrl: row.image_url || "",
    shortDescription: row.short_description || "",
    payload: row.payload || {},
    components,
    flightId: components.find(c => c.componentType === "flight")?.componentId || "",
    hotelId: components.find(c => c.componentType === "hotel")?.componentId || "",
    activityId: components.find(c => c.componentType === "activity")?.componentId || "",
    visibility: [
      row.customer_visible ? "public" : "",
      row.staff_visible ? "staff" : "",
      row.altea_visible ? "altea" : ""
    ].filter(Boolean).join("+"),
    updatedAt: row.updated_at || ""
  };
}

function mapComponent(row = {}) {
  return {
    id: row.id || "",
    productId: row.product_id || "",
    componentType: row.component_type || "",
    source: row.source || "",
    componentId: row.component_id || "",
    displayName: row.display_name || "",
    quantity: row.quantity || 1,
    sequenceNo: row.sequence_no || 1,
    costAmount: row.cost_amount || 0,
    retailAmount: row.retail_amount || 0,
    payload: row.payload || {}
  };
}

function mapAudit(row = {}) {
  return {
    id: row.id || "",
    timestamp: row.created_at || "",
    createdAt: row.created_at || "",
    eventType: row.event_type || "",
    domain: row.domain || "",
    entityTable: row.entity_table || "",
    entityId: row.entity_id || "",
    productKey: row.product_key || "",
    flightNumber: row.flight_number || "",
    departureDate: row.departure_date || "",
    classCode: row.class_code || "",
    beforeValue: row.before_value || "",
    afterValue: row.after_value || "",
    source: row.source || "",
    message: row.message || "",
    payload: row.payload || {},
    agentName: row.created_by_name || ""
  };
}

export async function insertAuditEvent(input = {}, agent = {}) {
  const row = {
    event_type: cleanText(input.eventType || input.event_type, 120),
    domain: cleanText(input.domain, 80),
    entity_table: cleanText(input.entityTable || input.entity_table, 120),
    entity_id: cleanText(input.entityId || input.entity_id, 160),
    product_key: cleanText(input.productKey || input.product_key, 160),
    flight_number: cleanUpper(input.flightNumber || input.flight_number, 20),
    departure_date: cleanDate(input.departureDate || input.departure_date) || null,
    class_code: cleanUpper(input.classCode || input.class_code, 10),
    before_value: cleanText(input.beforeValue || input.before_value, 500),
    after_value: cleanText(input.afterValue || input.after_value, 500),
    source: cleanText(input.source || "postgres", 80),
    message: cleanText(input.message, 500),
    payload: input.payload || {},
    created_by_agent_user_id: agent?.id || null,
    created_by_name: cleanText(agent?.display_name || agent?.displayName || agent?.email || agent?.sk_id || "", 180)
  };

  if (!row.event_type || !row.domain) {
    return null;
  }

  const result = await supabaseRequest("master_inventory_audit", {
    method: "POST",
    body: row,
    prefer: "return=representation"
  });

  return result?.[0] || null;
}

export async function getMasterInventorySnapshot(module = "fdi", filters = {}) {
  const [
    flightResult,
    scheduleResult,
    nestingResult,
    auditResult,
    hotelsResult,
    toursResult,
    ticketsResult,
    packageResult
  ] = await Promise.all([
    getFlightInventory(filters).catch(() => ({ flight: null, classes: [] })),
    getScheduleInventory(filters).catch(() => ({ schedule: [] })),
    getNestingControls(filters).catch(() => ({ nesting: [] })),
    getInventoryAudit(filters).catch(() => ({ audit: [] })),
    getHotelAllocations(filters).catch(() => ({ hotels: [] })),
    getTourCapacity(filters).catch(() => ({ tours: [] })),
    getPartnerTickets(filters).catch(() => ({ tickets: [] })),
    getPackageBundles(filters).catch(() => ({ packages: [] }))
  ]);

  return {
    module,
    flight: flightResult.flight,
    classes: flightResult.classes || [],
    schedule: scheduleResult.schedule || [],
    nesting: nestingResult.nesting || [],
    audit: auditResult.audit || [],
    hotels: hotelsResult.hotels || [],
    tours: toursResult.tours || [],
    tickets: ticketsResult.tickets || [],
    packages: packageResult.packages || [],
    lastSync: new Date().toISOString()
  };
}

export async function getFlightInventory(input = {}) {
  const f = filtersOf(input);
  const flightNumber = cleanUpper(f.flightNumber || f.flight, 20);
  const departureDate = cleanDate(f.departureDate || f.date);
  const boardPoint = cleanUpper(f.boardPoint || f.origin, 8);
  const offPoint = cleanUpper(f.offPoint || f.destination, 8);

  const legParams = ["select=*", "order=updated_at.desc", "limit=1"];
  addEq(legParams, "flight_number", flightNumber);
  addDateEq(legParams, "departure_date", departureDate);
  addEq(legParams, "board_point", boardPoint);
  addEq(legParams, "off_point", offPoint);

  const legs = await supabaseRequest(buildPath("inventory_flight_legs", legParams));
  const flight = mapFlightLeg(legs?.[0]);

  const classParams = ["select=*", "order=cabin.asc,nest.asc,class_code.asc", "limit=500"];

  if (flight?.id) {
    addEq(classParams, "flight_leg_id", flight.id);
  } else {
    addEq(classParams, "flight_number", flightNumber);
    addDateEq(classParams, "departure_date", departureDate);
    addEq(classParams, "board_point", boardPoint);
    addEq(classParams, "off_point", offPoint);
  }

  const classes = await supabaseRequest(buildPath("inventory_flight_classes", classParams));

  return {
    flight,
    classes: (classes || []).map(mapFlightClass),
    lastSync: new Date().toISOString()
  };
}

async function getExistingFlightClass(input = {}) {
  const params = ["select=*", "limit=1"];
  addEq(params, "flight_number", input.flightNumber);
  addDateEq(params, "departure_date", input.departureDate);
  addEq(params, "board_point", input.boardPoint);
  addEq(params, "off_point", input.offPoint);
  addEq(params, "class_code", input.classCode);

  const rows = await supabaseRequest(buildPath("inventory_flight_classes", params));
  return rows?.[0] || null;
}

export async function saveFlightClassCapacity(input = {}, agent = {}) {
  const f = filtersOf(input);

  const flightNumber = cleanUpper(f.flightNumber, 20);
  const departureDate = cleanDate(f.departureDate);
  const boardPoint = cleanUpper(f.boardPoint, 8);
  const offPoint = cleanUpper(f.offPoint, 8);
  const classCode = cleanUpper(f.classCode, 10);

  if (!flightNumber || !departureDate || !classCode) {
    throw new Error("Flight number, departure date, and class code are required.");
  }

  const existing = await getExistingFlightClass({
    flightNumber,
    departureDate,
    boardPoint,
    offPoint,
    classCode
  });

  const legRows = await supabaseRequest(
    "inventory_flight_legs?on_conflict=flight_number,departure_date,board_point,off_point",
    {
      method: "POST",
      body: {
        flight_number: flightNumber,
        departure_date: departureDate,
        board_point: boardPoint,
        off_point: offPoint,
        equipment_type: cleanUpper(f.equipmentType || existing?.equipment_type, 20),
        physical_capacity: intValue(f.physicalCapacity || 0),
        control_mode: cleanText(f.controlMode || "MANUAL", 40),
        status: cleanText(f.flightStatus || "open", 40),
        source: "postgres",
        created_by_agent_user_id: agent?.id || null
      },
      prefer: "resolution=merge-duplicates,return=representation"
    }
  );

  const leg = legRows?.[0] || null;

  const sold = f.sold !== undefined ? intValue(f.sold) : intValue(existing?.sold);
  const authorized = f.authorized !== undefined ? intValue(f.authorized) : intValue(existing?.authorized);
  const available = f.available !== undefined ? intValue(f.available) : authorized - sold;

  const rows = await supabaseRequest(
    "inventory_flight_classes?on_conflict=flight_number,departure_date,board_point,off_point,class_code",
    {
      method: "POST",
      body: {
        flight_leg_id: leg?.id || existing?.flight_leg_id || null,
        flight_number: flightNumber,
        departure_date: departureDate,
        board_point: boardPoint,
        off_point: offPoint,
        class_code: classCode,
        cabin: cleanUpper(f.cabin || existing?.cabin || "Y", 4),
        nest: cleanText(f.nest || existing?.nest || "", 20),
        authorized,
        sold,
        available,
        waitlist_limit: f.waitlistLimit !== undefined ? intValue(f.waitlistLimit) : intValue(existing?.waitlist_limit),
        overbooking_limit: f.overbookingLimit !== undefined ? intValue(f.overbookingLimit) : intValue(existing?.overbooking_limit),
        protection: f.protection !== undefined ? intValue(f.protection) : intValue(existing?.protection),
        status: cleanText(f.status || existing?.status || "open", 40),
        note: cleanText(f.note || existing?.note || "", 1000),
        payload: f.payload || existing?.payload || {},
        created_by_agent_user_id: agent?.id || null
      },
      prefer: "resolution=merge-duplicates,return=representation"
    }
  );

  const saved = rows?.[0] || null;

  await insertAuditEvent({
    eventType: "flight_class_capacity_update",
    domain: "air",
    entityTable: "inventory_flight_classes",
    entityId: saved?.id,
    productKey: flightNumber,
    flightNumber,
    departureDate,
    classCode,
    beforeValue: existing ? JSON.stringify({
      authorized: existing.authorized,
      sold: existing.sold,
      available: existing.available,
      status: existing.status
    }) : "",
    afterValue: JSON.stringify({
      authorized,
      sold,
      available,
      status: saved?.status || ""
    }),
    source: "postgres",
    message: "Flight class capacity updated.",
    payload: saved || {}
  }, agent);

  return mapFlightClass(saved);
}

export async function getScheduleInventory(input = {}) {
  const f = filtersOf(input);
  const params = ["select=*", "order=flight_number.asc,effective_date.asc", "limit=500"];

  addEq(params, "season_code", f.seasonCode);
  addEq(params, "flight_number", cleanUpper(f.flightNumber, 20));
  addEq(params, "board_point", cleanUpper(f.boardPoint, 8));
  addEq(params, "off_point", cleanUpper(f.offPoint, 8));

  const rows = await supabaseRequest(buildPath("inventory_schedule_lines", params));

  return {
    schedule: (rows || []).map(mapSchedule),
    lastSync: new Date().toISOString()
  };
}

export async function getNestingControls(input = {}) {
  const f = filtersOf(input);
  const params = ["select=*", "order=cabin.asc,nest.asc,class_code.asc", "limit=500"];

  addEq(params, "flight_number", cleanUpper(f.flightNumber, 20));
  addDateEq(params, "departure_date", f.departureDate);
  addEq(params, "board_point", cleanUpper(f.boardPoint, 8));
  addEq(params, "off_point", cleanUpper(f.offPoint, 8));

  const rows = await supabaseRequest(buildPath("inventory_nesting_controls", params));

  return {
    nesting: (rows || []).map(mapNesting),
    lastSync: new Date().toISOString()
  };
}

export async function getInventoryAudit(input = {}) {
  const f = filtersOf(input);
  const params = ["select=*", "order=created_at.desc", "limit=500"];

  addEq(params, "domain", f.domain);
  addEq(params, "product_key", f.productKey || f.flightNumber || f.hotelId || f.tourId || f.ticketId || f.sku);
  addDateEq(params, "departure_date", f.departureDate);
  addEq(params, "class_code", cleanUpper(f.classCode, 10));

  const rows = await supabaseRequest(buildPath("master_inventory_audit", params));

  return {
    audit: (rows || []).map(mapAudit),
    lastSync: new Date().toISOString()
  };
}

export async function getHotelAllocations(input = {}) {
  const f = filtersOf(input);
  const params = ["select=*", "order=allocation_date.asc,hotel_name.asc,room_type.asc", "limit=500"];

  addEq(params, "hotel_id", f.hotelId);
  addDateEq(params, "allocation_date", f.date || f.allocationDate || f.departureDate);
  addEq(params, "destination", cleanUpper(f.destination || f.offPoint, 8));
  addIlike(params, "hotel_name", f.query);

  const rows = await supabaseRequest(buildPath("hotel_allocations", params));

  return {
    hotels: (rows || []).map(mapHotel),
    lastSync: new Date().toISOString()
  };
}

async function getExistingHotel(input = {}) {
  const params = ["select=*", "limit=1"];
  addEq(params, "hotel_id", input.hotelId);
  addDateEq(params, "allocation_date", input.date);
  addEq(params, "room_type", input.roomType);

  const rows = await supabaseRequest(buildPath("hotel_allocations", params));
  return rows?.[0] || null;
}

export async function saveHotelAllotment(input = {}, agent = {}) {
  const hotelId = cleanText(input.hotelId || input.id, 120);
  const date = cleanDate(input.date || input.allocationDate);
  const roomType = cleanUpper(input.roomType, 40);

  if (!hotelId || !date || !roomType) {
    throw new Error("Hotel ID, allocation date, and room type are required.");
  }

  const existing = await getExistingHotel({ hotelId, date, roomType });

  const block = input.block !== undefined ? intValue(input.block) : intValue(existing?.room_block);
  const sold = input.sold !== undefined ? intValue(input.sold) : intValue(existing?.sold);

  const rows = await supabaseRequest(
    "hotel_allocations?on_conflict=hotel_id,allocation_date,room_type",
    {
      method: "POST",
      body: {
        hotel_id: hotelId,
        hotel_name: cleanText(input.hotelName || existing?.hotel_name, 200),
        destination: cleanUpper(input.destination || existing?.destination, 8),
        allocation_date: date,
        room_type: roomType,
        room_block: block,
        sold,
        net_rate: money(input.netRate !== undefined ? input.netRate : existing?.net_rate),
        public_rate: money(input.publicRate !== undefined ? input.publicRate : existing?.public_rate),
        currency: cleanUpper(input.currency || existing?.currency || "USD", 3),
        status: cleanText(input.status || existing?.status || (boolValue(input.blackout) ? "blackout" : "open"), 40),
        blackout: boolValue(input.blackout),
        image_url: cleanText(input.imageUrl || existing?.image_url, 1000),
        note: cleanText(input.note || existing?.note, 1000),
        payload: input.payload || existing?.payload || {},
        created_by_agent_user_id: agent?.id || null
      },
      prefer: "resolution=merge-duplicates,return=representation"
    }
  );

  const saved = rows?.[0] || null;

  await insertAuditEvent({
    eventType: "hotel_allotment_update",
    domain: "hotel",
    entityTable: "hotel_allocations",
    entityId: saved?.id,
    productKey: hotelId,
    beforeValue: existing ? JSON.stringify({
      block: existing.room_block,
      sold: existing.sold,
      status: existing.status,
      blackout: existing.blackout
    }) : "",
    afterValue: JSON.stringify({
      block,
      sold,
      status: saved?.status,
      blackout: saved?.blackout
    }),
    source: "postgres",
    message: "Hotel allotment updated.",
    payload: saved || {}
  }, agent);

  return mapHotel(saved);
}

export async function getTourCapacity(input = {}) {
  const f = filtersOf(input);
  const params = ["select=*", "order=service_date.asc,start_time.asc,activity_name.asc", "limit=500"];

  addEq(params, "tour_id", f.tourId);
  addDateEq(params, "service_date", f.date || f.serviceDate || f.departureDate);
  addEq(params, "destination", cleanUpper(f.destination || f.offPoint, 8));
  addIlike(params, "activity_name", f.query);

  const rows = await supabaseRequest(buildPath("tour_activity_inventory", params));

  return {
    tours: (rows || []).map(mapTour),
    lastSync: new Date().toISOString()
  };
}

async function getExistingTour(input = {}) {
  const params = ["select=*", "limit=1"];
  addEq(params, "tour_id", input.tourId);
  addDateEq(params, "service_date", input.date);
  addEq(params, "start_time", input.startTime);

  const rows = await supabaseRequest(buildPath("tour_activity_inventory", params));
  return rows?.[0] || null;
}

export async function saveTourCapacity(input = {}, agent = {}) {
  const tourId = cleanText(input.tourId || input.id, 120);
  const date = cleanDate(input.date || input.serviceDate);
  const startTime = cleanTime(input.startTime) || "00:00:00";

  if (!tourId || !date) {
    throw new Error("Tour ID and service date are required.");
  }

  const existing = await getExistingTour({ tourId, date, startTime });

  const capacity = input.capacity !== undefined ? intValue(input.capacity) : intValue(existing?.capacity);
  const sold = input.sold !== undefined ? intValue(input.sold) : intValue(existing?.sold);

  const rows = await supabaseRequest(
    "tour_activity_inventory?on_conflict=tour_id,service_date,start_time",
    {
      method: "POST",
      body: {
        tour_id: tourId,
        activity_name: cleanText(input.name || input.activityName || existing?.activity_name, 200),
        destination: cleanUpper(input.destination || existing?.destination, 8),
        service_date: date,
        start_time: startTime,
        capacity,
        sold,
        adult_price: money(input.adultPrice !== undefined ? input.adultPrice : existing?.adult_price),
        child_price: money(input.childPrice !== undefined ? input.childPrice : existing?.child_price),
        currency: cleanUpper(input.currency || existing?.currency || "USD", 3),
        guide: cleanText(input.guide || existing?.guide, 160),
        status: cleanText(input.status || existing?.status || "open", 40),
        image_url: cleanText(input.imageUrl || existing?.image_url, 1000),
        note: cleanText(input.note || existing?.note, 1000),
        payload: input.payload || existing?.payload || {},
        created_by_agent_user_id: agent?.id || null
      },
      prefer: "resolution=merge-duplicates,return=representation"
    }
  );

  const saved = rows?.[0] || null;

  await insertAuditEvent({
    eventType: "tour_capacity_update",
    domain: "tour",
    entityTable: "tour_activity_inventory",
    entityId: saved?.id,
    productKey: tourId,
    beforeValue: existing ? JSON.stringify({
      capacity: existing.capacity,
      sold: existing.sold,
      status: existing.status
    }) : "",
    afterValue: JSON.stringify({
      capacity,
      sold,
      status: saved?.status
    }),
    source: "postgres",
    message: "Tour capacity updated.",
    payload: saved || {}
  }, agent);

  return mapTour(saved);
}

export async function getPartnerTickets(input = {}) {
  const f = filtersOf(input);
  const params = ["select=*", "order=service_date.asc,vendor.asc,product_name.asc", "limit=500"];

  addEq(params, "vendor", cleanUpper(f.vendor, 80));
  addEq(params, "ticket_id", f.ticketId);
  addDateEq(params, "service_date", f.date || f.serviceDate || f.departureDate);
  addEq(params, "destination", cleanUpper(f.destination || f.offPoint, 8));
  addIlike(params, "product_name", f.query);

  const rows = await supabaseRequest(buildPath("partner_ticket_inventory", params));

  return {
    tickets: (rows || []).map(mapTicket),
    lastSync: new Date().toISOString()
  };
}

export async function logPartnerTicketSync(input = {}, agent = {}) {
  await insertAuditEvent({
    eventType: "partner_ticket_sync_request",
    domain: "ticket",
    entityTable: "partner_ticket_inventory",
    productKey: cleanText(input.ticketId || input.vendor || "partner-ticket-sync", 160),
    source: "postgres",
    message: "Partner ticket sync requested.",
    payload: input || {}
  }, agent);

  return getPartnerTickets(input);
}

export async function getPackageBundles(input = {}) {
  const f = filtersOf(input);
  const params = ["select=*", "product_type=eq.package", "order=updated_at.desc", "limit=500"];

  addEq(params, "product_id", f.sku || f.productId);
  addEq(params, "destination", cleanUpper(f.destination || f.offPoint, 8));
  addIlike(params, "title", f.query);

  const productRows = await supabaseRequest(buildPath("travel_products", params));
  const productIds = (productRows || []).map(row => row.product_id).filter(Boolean);

  let componentRows = [];

  if (productIds.length) {
    const inList = productIds.map(id => encodeURIComponent(id)).join(",");
    componentRows = await supabaseRequest(
      `travel_product_components?select=*&product_id=in.(${inList})&order=product_id.asc,sequence_no.asc`
    );
  }

  const componentsByProduct = {};

  for (const row of componentRows || []) {
    const productId = row.product_id;
    if (!componentsByProduct[productId]) componentsByProduct[productId] = [];
    componentsByProduct[productId].push(mapComponent(row));
  }

  return {
    packages: (productRows || []).map(row => mapProduct(row, componentsByProduct[row.product_id] || [])),
    lastSync: new Date().toISOString()
  };
}

export async function savePackageBundle(input = {}, agent = {}) {
  const productInput = input.travel_product || input.product || {};
  const componentsInput = input.travel_product_components || input.components || [];

  const productId = cleanText(productInput.product_id || productInput.productId || input.sku, 160);

  if (!productId) {
    throw new Error("Package product ID/SKU is required.");
  }

  const productRows = await supabaseRequest(
    "travel_products?on_conflict=product_id",
    {
      method: "POST",
      body: {
        product_id: productId,
        product_type: "package",
        title: cleanText(productInput.title, 240),
        destination: cleanUpper(productInput.destination, 8),
        start_date: cleanDate(productInput.start_date || productInput.startDate) || null,
        end_date: cleanDate(productInput.end_date || productInput.endDate) || null,
        base_price: money(productInput.base_price ?? productInput.basePrice),
        live_price: money(productInput.live_price ?? productInput.livePrice),
        margin_pct: money(productInput.margin_pct ?? productInput.marginPct),
        currency: cleanUpper(productInput.currency || "USD", 3),
        availability_status: cleanText(productInput.availability_status || productInput.availabilityStatus || "available", 60),
        supplier_source: cleanText(productInput.supplier_source || productInput.supplierSource || "mixed", 60),
        customer_visible: Boolean(productInput.customer_visible ?? productInput.customerVisible),
        staff_visible: productInput.staff_visible === false || productInput.staffVisible === false ? false : true,
        altea_visible: productInput.altea_visible === false || productInput.alteaVisible === false ? false : true,
        booking_flow: cleanText(productInput.booking_flow || productInput.bookingFlow || "package", 80),
        status: cleanText(productInput.status || "draft", 60),
        image_url: cleanText(productInput.image_url || productInput.imageUrl, 1000),
        short_description: cleanText(productInput.short_description || productInput.shortDescription, 1000),
        payload: productInput.payload || input.payload || {},
        created_by_agent_user_id: agent?.id || null
      },
      prefer: "resolution=merge-duplicates,return=representation"
    }
  );

  const product = productRows?.[0];

  await supabaseRequest(`travel_product_components?product_id=eq.${encodeURIComponent(productId)}`, {
    method: "DELETE",
    prefer: "return=minimal"
  });

  const componentRows = [];

  for (let i = 0; i < componentsInput.length; i += 1) {
    const component = componentsInput[i] || {};

    const componentRow = {
      product_id: productId,
      component_type: cleanText(component.component_type || component.componentType, 60),
      source: cleanText(component.source, 80),
      component_id: cleanText(component.component_id || component.componentId, 160),
      display_name: cleanText(component.display_name || component.displayName || component.reference, 240),
      quantity: intValue(component.quantity || 1),
      sequence_no: intValue(component.sequence_no || component.sequenceNo || i + 1),
      cost_amount: money(component.cost_amount ?? component.costAmount),
      retail_amount: money(component.retail_amount ?? component.retailAmount),
      payload: component.payload || component
    };

    if (componentRow.component_type && componentRow.source && componentRow.component_id) {
      componentRows.push(componentRow);
    }
  }

  if (componentRows.length) {
    await supabaseRequest("travel_product_components", {
      method: "POST",
      body: componentRows,
      prefer: "return=representation"
    });
  }

  await supabaseRequest("travel_product_price_cache?on_conflict=product_id,cache_key", {
    method: "POST",
    body: {
      product_id: productId,
      cache_key: "latest",
      base_price: money(productInput.base_price ?? productInput.basePrice),
      live_price: money(productInput.live_price ?? productInput.livePrice),
      margin_pct: money(productInput.margin_pct ?? productInput.marginPct),
      currency: cleanUpper(productInput.currency || "USD", 3),
      availability: cleanText(productInput.availability_status || "available", 60),
      supplier_snapshot: input || {},
      checked_at: new Date().toISOString()
    },
    prefer: "resolution=merge-duplicates,return=representation"
  });

  await insertAuditEvent({
    eventType: "package_bundle_commit",
    domain: "package",
    entityTable: "travel_products",
    entityId: product?.id,
    productKey: productId,
    source: "postgres",
    message: "Package bundle committed.",
    payload: {
      product,
      components: componentRows
    }
  }, agent);

  return {
    product: mapProduct(product, componentRows.map(mapComponent)),
    components: componentRows,
    committed: true
  };
}