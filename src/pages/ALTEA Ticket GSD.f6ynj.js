// pages/riaintra-altea.js
// Page URL: /riaintra/altea
// ALTEA HTML Embed ID: #alteaMasterEmbed
// Global Staff Chrome HTML Embed ID: #staffInternalChromeEmbed

import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";

import {
  getAlteaMasterState,
  searchAlteaMasterBookings,
  getAlteaMasterBooking,
  searchAlteaAmadeusFlightOffers,
  priceAlteaAmadeusOffer,
  createAlteaMasterBookingDraft,
  saveAlteaMasterSegments,
  getAlteaPackageInventory,
  saveAlteaFidsFlight,
  runAlteaTerminalCommand,
  logAlteaSyncEvent
} from "backend/RIA/alteaMaster.web";
import {
  getMasterInventoryState,
  fetchFlightInventory,
  updateFlightClassCapacity,
  fetchScheduleInventory,
  fetchNestingControls,
  fetchInventoryAudit,
  fetchHotelAllocations,
  updateHotelAllotment,
  fetchTourCapacity,
  updateTourCapacity,
  fetchPartnerTickets,
  syncPartnerTickets,
  fetchPackageBundles,
  commitPackageBundle
} from "backend/RIA/masterInventory.web";

import { runInternalGlobalSearch } from "backend/FINAL/internalChrome.web";
import { bindInternalHtmlBridge } from 'public/internalHtmlBridge';
import {
  getHrSession,
  listStaff,
  saveStaff,
  setStaffActive,
  generateSkId,
  printStaffBadge,
  getStaffHrReports,
} from 'backend/RIA/staffHR.web';
import {
  savePayrollProfile,
  createPayrollPeriod,
  calculatePayrollRun,
  finalizePayrollRun,
} from 'backend/RIA/staffPayroll.web';

const HR_TYPES = new Set([
  'HR_READY', 'HR_REFRESH', 'HR_SAVE_STAFF', 'HR_DEACTIVATE', 'HR_REACTIVATE',
  'HR_GENERATE_SKID', 'HR_PRINT_BADGE', 'HR_REPORTS_REQUEST',
  'PAYROLL_SAVE_PROFILE', 'PAYROLL_CREATE_PERIOD', 'PAYROLL_CALCULATE_RUN', 'PAYROLL_FINALIZE_RUN',
  // Keep the existing handlers for HR_WIX_*, HR_PORTAL_*, Crewcontrol, and Badge Control.
]);

$w.onReady(() => {
  bindInternalHtmlBridge({
    embed: $w('#staffHrEmbed'),
    allowedSources: new Set(['SKANDI_HR_STAFF', 'SKANDI_CAREERS_CONTROL']),
    allowedTypes: HR_TYPES,
    toError: () => ({ type: 'HR_ERROR', payload: { code: 'ACTION_FAILED' } }),
    handle: async ({ type, payload }) => {
      switch (type) {
        case 'HR_READY':
        case 'HR_REFRESH': {
          const [session, staff] = await Promise.all([getHrSession(), listStaff(payload)]);
          return [
            { type: 'HR_SESSION', payload: session },
            { type: 'HR_STAFF_LIST', payload: { staff } },
          ];
        }
        case 'HR_SAVE_STAFF':
          return { type: 'HR_STAFF_SAVED', payload: await saveStaff(payload) };
        case 'HR_DEACTIVATE':
          return { type: 'HR_ACTION_OK', payload: await setStaffActive({ ...payload, active: false }) };
        case 'HR_REACTIVATE':
          return { type: 'HR_ACTION_OK', payload: await setStaffActive({ ...payload, active: true }) };
        case 'HR_GENERATE_SKID':
          return { type: 'HR_SKID_GENERATED', payload: await generateSkId(payload) };
        case 'HR_PRINT_BADGE':
          return { type: 'HR_BADGE_PRINTED', payload: await printStaffBadge(payload) };
        case 'HR_REPORTS_REQUEST':
          return { type: 'HR_REPORTS', payload: await getStaffHrReports(payload) };
        case 'PAYROLL_SAVE_PROFILE':
          return { type: 'PAYROLL_PROFILE_SAVED', payload: await savePayrollProfile(payload) };
        case 'PAYROLL_CREATE_PERIOD':
          return { type: 'PAYROLL_PERIOD_CREATED', payload: await createPayrollPeriod(payload) };
        case 'PAYROLL_CALCULATE_RUN':
          return { type: 'PAYROLL_RUN_CALCULATED', payload: await calculatePayrollRun(payload) };
        case 'PAYROLL_FINALIZE_RUN':
          return { type: 'PAYROLL_RUN_FINALIZED', payload: await finalizePayrollRun(payload) };
        default:
          return { type: 'HR_ERROR', payload: { code: 'UNHANDLED_EVENT' } };
      }
    },
  });
});
const ALTEA_EMBED_ID = "#alteaMasterEmbed";
const CHROME_EMBED_ID = "#staffInternalChromeEmbed";

const STAFF_LOGIN_PATH = "/riaintra";
const HOME_PATH = "/";

const ALLOWED_PATH_PREFIXES = [
  "/riaintra",
  "/altea",
  "/booking",
  "/home"
];

let alteaHtml;
let chromeHtml;

let lastStaff = {};
let lastApps = [];

$w.onReady(function () {
  alteaHtml = $w(ALTEA_EMBED_ID);
  chromeHtml = $w(CHROME_EMBED_ID);

  alteaHtml.onMessage(async (event) => {
    await handleMessage(event);
  });

  chromeHtml.onMessage(async (event) => {
    await handleMessage(event);
  });
});

async function handleMessage(event) {
  const msg = event.data || {};
  const payload = getPayload(msg);

  try {
    if (msg.source === "SKANDI_INTERNAL_CHROME") {
      await handleInternalChrome(msg, payload);
      return;
    }

    if (msg.source !== "SKANDI_ALTEA_MASTER") {
      return;
    }

    // MASTER INVENTORY / POSTGRESQL HANDLERS

    if (msg.type === "MASTER_INVENTORY_READY") {
      const result = await getMasterInventoryState({
        module: payload.module || "fdi"
      });

      post(alteaHtml, "MASTER_INVENTORY_BOOTSTRAP", result);
      return;
    }

    if (msg.type === "INVENTORY_FETCH_FLIGHT") {
      const result = await fetchFlightInventory(payload);
      post(alteaHtml, "INVENTORY_FLIGHT_RESULT", result);
      return;
    }

    if (msg.type === "INVENTORY_UPDATE_CLASS_CAPACITY") {
      const result = await updateFlightClassCapacity(payload);

      post(alteaHtml, "INVENTORY_ACTION_OK", {
        message: "Flight class capacity updated.",
        result
      });

      return;
    }

    if (msg.type === "INVENTORY_FETCH_SCHEDULE") {
      const result = await fetchScheduleInventory(payload);
      post(alteaHtml, "INVENTORY_SCHEDULE_RESULT", result);
      return;
    }

    if (msg.type === "INVENTORY_FETCH_NESTING") {
      const result = await fetchNestingControls(payload);
      post(alteaHtml, "INVENTORY_NESTING_RESULT", result);
      return;
    }

    if (msg.type === "INVENTORY_FETCH_AUDIT") {
      const result = await fetchInventoryAudit(payload);
      post(alteaHtml, "INVENTORY_AUDIT_RESULT", result);
      return;
    }

    if (msg.type === "HOTEL_FETCH_ALLOCATIONS") {
      const result = await fetchHotelAllocations(payload);
      post(alteaHtml, "HOTEL_ALLOCATIONS_RESULT", result);
      return;
    }

    if (msg.type === "HOTEL_UPDATE_ALLOTMENT") {
      const result = await updateHotelAllotment(payload);

      post(alteaHtml, "INVENTORY_ACTION_OK", {
        message: "Hotel allotment updated.",
        result
      });

      return;
    }

    if (msg.type === "TOUR_FETCH_CAPACITY") {
      const result = await fetchTourCapacity(payload);
      post(alteaHtml, "TOUR_CAPACITY_RESULT", result);
      return;
    }

    if (msg.type === "TOUR_UPDATE_CAPACITY") {
      const result = await updateTourCapacity(payload);

      post(alteaHtml, "INVENTORY_ACTION_OK", {
        message: "Tour capacity updated.",
        result
      });

      return;
    }

    if (msg.type === "PARTNER_FETCH_TICKETS") {
      const result = await fetchPartnerTickets(payload);
      post(alteaHtml, "PARTNER_TICKETS_RESULT", result);
      return;
    }

    if (msg.type === "PARTNER_SYNC_REQUEST") {
      const result = await syncPartnerTickets(payload);
      post(alteaHtml, "PARTNER_TICKETS_RESULT", result);
      return;
    }

    if (msg.type === "PACKAGE_FETCH_BUNDLES") {
      const result = await fetchPackageBundles(payload);
      post(alteaHtml, "PACKAGE_BUNDLES_RESULT", result);
      return;
    }

    if (msg.type === "PACKAGE_COMMIT_BUNDLE") {
      const result = await commitPackageBundle(payload);

      post(alteaHtml, "INVENTORY_ACTION_OK", {
        message: "Package bundle committed to PostgreSQL.",
        result
      });

      return;
    }

    // EXISTING ALTEA HANDLERS

    if (msg.type === "ALTEA_TERMINAL_COMMAND") {
      const result = await runAlteaTerminalCommand({
        command: payload.command || "",
        bookingId: payload.bookingId || ""
      });

      post(alteaHtml, "ALTEA_TERMINAL_RESULT", result);
      return;
    }

    if (msg.type === "ALTEA_READY" || msg.type === "ALTEA_BOOTSTRAP") {
      await bootstrapAltea(payload.query || "");
      return;
    }

    if (msg.type === "ALTEA_NAVIGATE") {
      openAllowedPath(String(payload.path || "").trim());
      return;
    }

    if (msg.type === "ALTEA_SEARCH_AMADEUS") {
      await handleAmadeusSearch(payload.search || {});
      return;
    }

    if (msg.type === "ALTEA_PRICE_OFFER") {
      const result = await priceAlteaAmadeusOffer({
        offerCacheId:
          payload.offerCacheId ||
          payload.offer?.offerCacheId ||
          payload.id ||
          "",
        offer:
          payload.rawOffer ||
          payload.offer?.rawOffer ||
          null
      });

      post(alteaHtml, "ALTEA_PRICE_RESULT", result);

      postAlteaOk("Offer priced.", {
        offer: result.offer
      });

      return;
    }

    if (msg.type === "ALTEA_CREATE_CART_FROM_OFFER") {
      const result = await createAlteaMasterBookingDraft({
        booking: {
          cartId: payload.offerCacheId || "",
          bookingType: "CART",
          productType: "FLIGHT_ONLY",
          status: "cart",
          sourcePage: "/riaintra/altea",
          sourceChannel: "riaintra-altea",
          payload
        }
      });

      postAlteaOk("Booking cart created.", {
        cartId: result.booking?.id || "",
        bookingReference: result.booking?.booking_reference || "",
        bookingId: result.booking?.id || ""
      });

      return;
    }

    if (msg.type === "ALTEA_OPEN_BOOKING") {
      const bookingId = payload.bookingId || payload.cartId || "";

      if (bookingId) {
        try {
          await getAlteaMasterBooking({ bookingId });
        } catch (err) {}

        wixLocation.to(`/riaintra/altea?bookingId=${encodeURIComponent(bookingId)}`);
      }

      return;
    }

    if (msg.type === "ALTEA_SEARCH_PACKAGE_INVENTORY") {
      await handlePackageInventorySearch(payload.search || {});
      return;
    }

    if (msg.type === "ALTEA_CREATE_PACKAGE_CART") {
      await handleCreatePackageCart(payload.offer || {}, payload.search || {});
      return;
    }

    if (msg.type === "ALTEA_FIDS_UPDATE") {
      await handleFidsUpdate(payload.flight || {});
      return;
    }

  } catch (err) {
    const message = cleanError(err);

    post(alteaHtml, "INVENTORY_ERROR", {
      message
    });

    postAlteaError(message);

    postChrome("INTERNAL_SEARCH_RESULTS", {
      results: []
    });
  }
}

async function bootstrapAltea(query = "") {
  const state = await getAlteaMasterState();

  lastStaff = state.staff || {};
  lastApps = state.apps || [];

  sendChrome("ALTEA Master Control", lastStaff, lastApps);

  let bookings = state.snapshot?.bookings || [];

  if (query) {
    const searchResult = await searchAlteaMasterBookings({ query });
    bookings = searchResult.bookings || [];
  }

  const payload = {
    session: {
      staff: lastStaff
    },
    stats: mapStats(state.snapshot?.stats || {}, state.snapshot || {}),
    bookings: bookings.map(mapBooking),
    queue: (state.snapshot?.queue || []).map(mapQueueItem),
    sync: (state.snapshot?.sync || []).map(mapSyncEvent)
  };

  post(alteaHtml, "ALTEA_BOOTSTRAP_RESULT", payload);

  post(alteaHtml, "ALTEA_FIDS_SNAPSHOT", {
    flights: (state.snapshot?.flights || []).map(mapFidsFlight)
  });
}

async function handleAmadeusSearch(search = {}) {
  const result = await searchAlteaAmadeusFlightOffers({
    search
  });

  post(alteaHtml, "ALTEA_SEARCH_RESULT", {
    offers: result.offers || [],
    dictionaries: result.dictionaries || {}
  });

  postAlteaOk("Amadeus offers loaded.", {
    count: (result.offers || []).length
  });
}

async function handlePackageInventorySearch(search = {}) {
  const result = await getAlteaPackageInventory({
    filters: {
      destination: search.destination || "",
      itemType: search.itemType || ""
    }
  });

  const mapped = mapPackageInventory(result.inventory || []);

  post(alteaHtml, "ALTEA_PACKAGE_INVENTORY_RESULT", {
    inventory: mapped,
    flights: mapped.flights,
    hotels: mapped.hotels,
    transfers: mapped.transfers,
    excursions: mapped.excursions
  });
}

async function handleCreatePackageCart(offer = {}, search = {}) {
  const cartId = `ALT-${Date.now().toString(36).toUpperCase()}`;

  const created = await createAlteaMasterBookingDraft({
    booking: {
      cartId,
      bookingType: "CART",
      productType: normalizeProductType(offer.tripType || offer.itemType || search.productType),
      status: "cart",
      origin: search.origin || offer.searchContext?.origin || "",
      destination: search.destination || offer.searchContext?.destination || "",
      departureDate: search.departureDate || offer.searchContext?.departureDate || "",
      returnDate: search.returnDate || offer.searchContext?.returnDate || "",
      currency: offer.price?.currency || search.currency || "SEK",
      totalAmount: offer.price?.amount || 0,
      taxAmount: 0,
      sourcePage: "/riaintra/altea",
      sourceChannel: "riaintra-altea-package-builder",
      payload: {
        offer,
        search
      }
    }
  });

  const bookingId = created.booking?.id;

  if (bookingId && Array.isArray(offer.components)) {
    await saveAlteaMasterSegments({
      bookingId,
      segments: offer.components.map((component) =>
        mapPackageComponentToSegment(component, offer, search)
      )
    });
  }

  post(alteaHtml, "ALTEA_PACKAGE_CART_CREATED", {
    cartId: bookingId || cartId,
    bookingId: bookingId || "",
    bookingReference: created.booking?.booking_reference || ""
  });
}

async function handleFidsUpdate(flight = {}) {
  await saveAlteaFidsFlight({
    flight: {
      flightKey: flight.id || flight.flight || "",
      flightNumber: flight.flight || "",
      airlineCode: flight.carrier || String(flight.flight || "").slice(0, 2),
      airlineName: flight.airline || "",
      origin: flight.origin || "",
      destination: flight.destination || "",
      departureDate: flight.departureDate || new Date().toISOString().slice(0, 10),
      scheduledTime: flight.time || flight.scheduledTime || "",
      estimatedTime: flight.estimatedTime || "",
      actualTime: flight.actualTime || "",
      gate: flight.gate || "",
      terminal: flight.terminal || "",
      belt: flight.belt || "",
      status: flight.status || "ON_TIME",
      aircraftType: flight.aircraftType || "",
      registration: flight.registration || "",
      payload: flight
    }
  });

  postAlteaOk("FIDS flight saved.", {
    flight
  });
}

async function handleInternalChrome(msg, payload = {}) {
  if (msg.type === "INTERNAL_CHROME_READY") {
    sendChrome("ALTEA Master Control", lastStaff, lastApps);
    return;
  }

  if (msg.type === "INTERNAL_NAVIGATE") {
    openAllowedPath(String(payload.path || "").trim());
    return;
  }

  if (msg.type === "INTERNAL_LOGOUT") {
    await authentication.logout();
    wixLocation.to(HOME_PATH);
    return;
  }

  if (msg.type === "INTERNAL_GLOBAL_SEARCH") {
    const result = await runInternalGlobalSearch(payload.query || "");
    postChrome("INTERNAL_SEARCH_RESULTS", result);
  }
}

function sendChrome(pageName, profile = {}, apps = []) {
  postChrome("INTERNAL_CHROME_BOOTSTRAP", {
    pageName,
    pagePath: "/" + wixLocation.path.join("/"),
    pageSubtitle: "SKANDI ALTEA operations control",
    profile,
    apps,
    isAltea: true
  });
}

function openAllowedPath(path) {
  if (!path) throw new Error("Missing destination.");

  const isAllowed = ALLOWED_PATH_PREFIXES.some((prefix) =>
    path === prefix || path.startsWith(`${prefix}/`)
  );

  if (!isAllowed) throw new Error("Invalid destination.");

  wixLocation.to(path);
}

function getPayload(msg = {}) {
  if (msg.payload && typeof msg.payload === "object") {
    return msg.payload;
  }

  const payload = { ...msg };
  delete payload.source;
  delete payload.type;
  delete payload.timestamp;

  return payload;
}

function postAlteaOk(message, payload = {}) {
  post(alteaHtml, "ALTEA_ACTION_OK", payload, { message });
}

function postAlteaError(message) {
  post(alteaHtml, "ALTEA_ERROR", {}, { message });
}

function postChrome(type, payload = {}) {
  post(chromeHtml, type, payload);
}

function post(html, type, payload = {}, extra = {}) {
  if (!html) return;

  html.postMessage({
    source: "SKANDI_WIX_PARENT",
    type,
    payload,
    timestamp: new Date().toISOString(),
    ...extra
  });
}

function mapStats(stats = {}, snapshot = {}) {
  return {
    searchSessions: stats.searchSessions || 0,
    offerCache: stats.offerCache || 0,
    bookingCarts: stats.activeBookings || 0,
    amadeusOrders: stats.amadeusOrders || 0,
    alteaRecords: (snapshot.bookings || []).length,
    errors: stats.syncWarnings || 0,
    lastSync: new Date().toISOString(),
    amadeusMode: "postgres-connected"
  };
}

function mapBooking(b = {}) {
  return {
    _id: b.id,
    id: b.id,
    bookingRef: b.booking_reference || "",
    bookingReference: b.booking_reference || "",
    cartId: b.id || b.cart_id || "",
    pnr: b.pnr_locator || "",
    pnrLocator: b.pnr_locator || "",
    customerName: b.customer_name || "",
    customerEmail: b.customer_email || "",
    status: b.status || "",
    paymentStatus: b.payment_status || "",
    route: [b.origin, b.destination].filter(Boolean).join(" → "),
    origin: b.origin || "",
    destination: b.destination || "",
    departureDate: b.departure_date || "",
    price: {
      currency: b.currency || "SEK",
      amount: Number(b.total_amount || 0)
    },
    createdAt: b.created_at || ""
  };
}

function mapQueueItem(q = {}) {
  return {
    id: q.id,
    title: q.title || q.queue_category || "Queue item",
    eventType: q.queue_category || "QUEUE",
    status: q.status || "",
    createdAt: q.created_at || "",
    message: q.description || q.booking_reference || q.pnr_locator || ""
  };
}

function mapSyncEvent(s = {}) {
  return {
    id: s.id,
    collectionId: s.source_system || "",
    type: s.event_type || "",
    message: s.message || "",
    updatedAt: s.created_at || "",
    createdAt: s.created_at || "",
    ok: s.status !== "failed" && s.status !== "warning"
  };
}

function mapFidsFlight(f = {}) {
  const flightNumber = f.flight_number || "";

  return {
    id: f.flight_key || f.id || flightNumber,
    flight: flightNumber,
    carrier: f.airline_code || flightNumber.slice(0, 2),
    airline: f.airline_name || "",
    origin: f.origin || "",
    destination: f.destination || "",
    time: f.scheduled_time || "",
    gate: f.gate || "",
    terminal: f.terminal || "",
    belt: f.belt || "",
    status: f.status || "ON_TIME",
    remarks: f.payload?.remarks || "",
    message: f.payload?.message || "",
    departureDate: f.departure_date || ""
  };
}

function mapPackageInventory(rows = []) {
  const mapped = {
    flights: [],
    hotels: [],
    transfers: [],
    excursions: []
  };

  rows.forEach((item) => {
    const mappedItem = {
      id: item.id,
      type: item.item_type,
      itemType: item.item_type,
      source: "postgres",
      title: item.item_name || item.item_code || "Inventory item",
      summary: [
        item.origin && item.destination ? `${item.origin} → ${item.destination}` : "",
        item.location_name || "",
        item.start_date || ""
      ].filter(Boolean).join(" · "),
      origin: item.origin || "",
      destination: item.destination || "",
      startDate: item.start_date || "",
      endDate: item.end_date || "",
      supplierCode: item.supplier_code || "",
      supplierName: item.supplier_name || "",
      price: {
        currency: item.currency || "SEK",
        amount: Number(item.base_price || 0) + Number(item.tax_amount || 0)
      },
      payload: item.payload || {}
    };

    if (item.item_type === "flight") mapped.flights.push(mappedItem);
    if (item.item_type === "hotel") mapped.hotels.push(mappedItem);
    if (item.item_type === "transfer") mapped.transfers.push(mappedItem);
    if (item.item_type === "excursion") mapped.excursions.push(mappedItem);
  });

  return mapped;
}

function mapPackageComponentToSegment(component = {}, offer = {}, search = {}) {
  const type = normalizeSegmentType(component.itemType || component.type || component.role);

  return {
    segmentType: type,
    segmentRef: component.id || "",
    supplierCode: component.supplierCode || "",
    supplierName: component.supplierName || "",
    status: "holding",
    origin: component.origin || search.origin || offer.searchContext?.origin || "",
    destination: component.destination || search.destination || offer.searchContext?.destination || "",
    startDate: component.startDate || search.departureDate || offer.searchContext?.departureDate || "",
    endDate: component.endDate || search.returnDate || offer.searchContext?.returnDate || "",
    flightNumber: type === "flight" ? component.title || "" : "",
    hotelName: type === "hotel" ? component.title || "" : "",
    transferType: type === "transfer" ? component.title || "" : "",
    excursionName: type === "excursion" ? component.title || "" : "",
    quantity: 1,
    currency: component.price?.currency || offer.price?.currency || search.currency || "SEK",
    unitAmount: component.price?.amount || 0,
    totalAmount: component.price?.amount || 0,
    payload: component
  };
}

function normalizeProductType(value = "") {
  const key = String(value || "").trim().toUpperCase();

  if (key === "FLIGHT_ONLY" || key === "FLIGHT") return "FLIGHT_ONLY";
  if (key === "HOTEL_ONLY" || key === "HOTEL") return "HOTEL_ONLY";
  if (key === "TRANSFER_ONLY" || key === "TRANSFER") return "TRANSFER_ONLY";
  if (key === "EXCURSION_ONLY" || key === "EXCURSION") return "EXCURSION_ONLY";
  if (key === "CHARTER_PACKAGE") return "CHARTER_PACKAGE";

  return "MIXED_PACKAGE";
}

function normalizeSegmentType(value = "") {
  const key = String(value || "").trim().toLowerCase();

  if (key === "air" || key === "flight") return "flight";
  if (key === "htl" || key === "hotel") return "hotel";
  if (key === "trf" || key === "transfer") return "transfer";
  if (key === "exc" || key === "excursion") return "excursion";

  return "ancillary";
}

function cleanError(err) {
  const msg = String(err?.message || err || "").trim();
  if (!msg) return "Something went wrong.";
  if (msg.length > 220) return "Something went wrong. Check site monitoring logs.";
  return msg;
}
