
    "use strict";

    function skandiDuffelOfferExpiredNow(offer) {
      if (!offer || offer.isExpired === true) return true;
      const expiry = String(offer.expiresAt || "").trim();
      if (!expiry) return true;
      const time = Date.parse(expiry);
      return !Number.isFinite(time) || time <= Date.now();
    }

    const CHILD_SOURCE = "SKANDI_DUFFEL_RESERVATIONS";
    const PARENT_SOURCE = "SKANDI_WIX_PARENT";
    const EXCLUSIVE_ACTIONS = new Set([
      "DUFFEL_PREPARE_PAYMENT",
      "DUFFEL_CREATE_ORDER",
      "DUFFEL_CREATE_CANCELLATION",
      "DUFFEL_CONFIRM_CANCELLATION",
      "DUFFEL_CREATE_ORDER_CHANGE",
      "DUFFEL_CONFIRM_ORDER_CHANGE",
      "ALTEA_CREATE_LOCAL_BOOKING"
    ]);


    const VIEW_TITLES = {
      dashboard: "Dashboard",
      search: "Flight Search",
      hotels: "Hotel Search",
      cars: "Car Rental",
      services: "Trip Components",
      packagebuilder: "Package Builder",
      offer: "Offer Review",
      workspace: "Create Air Booking",
      orders: "Bookings & Orders",
      booking: "Booking File",
      passengers: "Passengers / APIS",
      club: "SKANDI Club",
      ticketing: "Ticketing & Documents",
      requirements: "Travel Requirements",
      actions: "Changes / Refunds",
      departure: "Departure Control",
      baggage: "Baggage & Boarding",
      manifests: "Operations & Manifests",
      history: "History & Audit",
      reports: "Sales Reports",
      preferences: "Preferences"
    };


    const state = {
      activeView: "dashboard",
      connected: false,
      bridgeConnected: false,
      environment: null,
      busyCount: 0,
      pending: new Map(),
      offers: [],
      selectedOffer: null,
      seatMaps: [],
      selectedServices: new Map(),
      orders: [],
      alteaBookings: [],
      alteaWorkspace: null,
      inventory: [],
      requirements: [],
      changeRequestId: "",
      changeOffers: [],
      pendingChange: null,
      paymentPurpose: null,
      selectedPassengerId: "",
      bookingDocuments: [],
      documentCatalog: [],
      selectedOrder: null,
      cancellation: null,
      customerRefundRequired: false,
      search: null,
      multiSearchActive:false,
      multiSearchQueue:[],
      multiSearchCompleted:0,
      multiSearchFailed:0,
      multiSearchPendingId:"",
      searchPendingId:"",
      orderLookupRequestId:"",
      orderLookupReference:"",
      offerRefreshRequestId:"",
      offerRefreshOfferId:"",
      seatMapRequestId:"",
      seatMapOfferId:"",
      paymentPrepareRequestId:"",
      paymentPrepareOfferId:"",
      orderCreateRequestId:"",
      orderCreateOfferId:"",
      preferences: {
        compact: true,
        currency: "USD",
        supplierTimeout: 15000
      },
      payment: null,
      stripe: null,
      stripeElements: null,
      stripePaymentElement: null,
      clubSelectedCustomerId: "",
      clubSearchLoaded: false,
      clubSearchType: "all",
      clubMembershipFilter: "all"
    };
    // --- ALTÉA FLIGHT & FARE SYNCHRONIZER ---
function syncFlightDataToBooking(targetBooking, flightSource) {
  if (!targetBooking || !flightSource) return targetBooking;

  const slices = flightSource.slices || [];
  const segments = slices.flatMap(s => s.segments || []);
  const firstSeg = segments[0] || {};
  const lastSeg = segments[segments.length - 1] || firstSeg;

  // Extract Fare Breakdown
  const baseAmount = flightSource.baseAmount != null ? Number(flightSource.baseAmount) : null;
  const taxAmount = flightSource.taxAmount != null ? Number(flightSource.taxAmount) : null;
  const knownTotal = flightSource.totalAmount ?? targetBooking.totalAmount;
  const totalAmount = knownTotal === null || knownTotal === undefined || knownTotal === "" || !Number.isFinite(Number(knownTotal)) ? null : Number(knownTotal);
  const currency = flightSource.totalCurrency || targetBooking.currency || null;

  // Build Comprehensive Segments Matrix
  const enrichedSegments = [];
  slices.forEach((slice, sliceIdx) => {
    (slice.segments || []).forEach((seg, segIdx) => {
      const paxDetails = (seg.passengers || []).map(p => ({
        passengerId: p.passenger_id || p.id,
        fareBasisCode: p.fare_basis_code || p.fareBasisCode || slice.fare_basis_code || slice.fareBasisCode || null,
        cabinClass: p.cabin_class || p.cabinClass || null,
        cabinBrand: slice.fare_brand_name || slice.fareBrandName || p.cabin_class_marketing_name || p.cabinClassMarketingName || null,
        baggage: Array.isArray(p.baggages) && p.baggages.length > 0
          ? p.baggages.map(b => `${b.quantity == null ? "Unknown quantity" : b.quantity} (${b.type || "type not supplied"})`).join(", ")
          : null
      }));

      enrichedSegments.push({
        segId: `${sliceIdx + 1}.${segIdx + 1}`,
        flightNumber: `${seg.marketingCarrier?.iataCode || seg.marketing_carrier?.iata_code || ""}${seg.marketingFlightNumber || seg.marketing_flight_number || ""}`,
        operatingCarrier: seg.operatingCarrier?.name || seg.operating_carrier?.name || null,
        origin: seg.origin?.iataCode || seg.origin?.iata_code || "",
        originTerminal: seg.originTerminal || seg.origin_terminal || "—",
        destination: seg.destination?.iataCode || seg.destination?.iata_code || "",
        destinationTerminal: seg.destinationTerminal || seg.destination_terminal || "—",
        departingAt: seg.departingAt || seg.departing_at,
        arrivingAt: seg.arrivingAt || seg.arriving_at,
        aircraft: seg.aircraft?.name || seg.aircraft?.iataCode || null,
        duration: seg.duration || null,
        rbd: seg.booking_class || seg.rbd || null,
        passengers: paxDetails
      });
    });
  });

  // Extract Conditions / Fare Rules
  const cond = flightSource.conditions || {};
  const refundRule = cond.refund_before_departure || cond.refundBeforeDeparture;
  const changeRule = cond.change_before_departure || cond.changeBeforeDeparture;

  // Embed into Booking Record
  targetBooking.origin = targetBooking.origin || firstSeg.origin?.iataCode || firstSeg.origin?.iata_code || "";
  targetBooking.destination = targetBooking.destination || lastSeg.destination?.iataCode || lastSeg.destination?.iata_code || "";
  targetBooking.departureDate = targetBooking.departureDate || (firstSeg.departingAt || "").slice(0, 10);
  
  targetBooking.flightDetails = {
    slicesCount: slices.length,
    segments: enrichedSegments,
    pricingRecord: {
      baseAmount: baseAmount,
      taxAmount: taxAmount,
      totalAmount: totalAmount,
      currency: currency,
      fareBrand: slices[0]?.fare_brand_name || slices[0]?.fareBrandName || null,
      validatingCarrier: flightSource.owner?.iataCode || flightSource.owner?.iata_code || firstSeg.marketingCarrier?.iataCode || null,
      paymentDeadline: flightSource.paymentRequiredBy || null
    },
    miniRules: {
      refundable: typeof refundRule?.allowed === "boolean" ? refundRule.allowed : null,
      refundPenalty: refundRule?.penalty_amount || refundRule?.penaltyAmount || null,
      changeable: typeof changeRule?.allowed === "boolean" ? changeRule.allowed : null,
      changePenalty: changeRule?.penalty_amount || changeRule?.penaltyAmount || null
    }
  };

  return targetBooking;
}
    // --- ALTÉA PAGE-TAB / PNR SESSION MANAGEMENT ---
    // ARD Web keeps Home separate from record tabs. Each open PNR record owns its
    // working state; global reference data and host connectivity remain shared.
    const AMADEUS_HOME_SESSION = "home";
    const MAX_PNR_TABS = 5;
    const PNR_PRODUCT_VIEWS = new Set(["search", "hotels", "cars", "transfers", "packagebuilder"]);
    const PNR_INTERNAL_VIEWS = new Set([
      "offer", "workspace", "booking", "passengers", "club", "services",
      "ticketing", "requirements", "actions", "baggage", "manifests", "history"
    ]);
    const GLOBAL_ONLY_VIEWS = new Set(["dashboard", "orders", "departure", "reports", "preferences"]);
    const PNR_REQUIRES_BOOKING_VIEWS = new Set([
      "booking", "passengers", "club", "ticketing", "requirements",
      "actions", "baggage", "manifests", "history"
    ]);
    const SESSION_STATE_KEYS = [
      "activeView", "search", "offers", "multiSearchActive", "multiSearchQueue", "multiSearchCompleted", "multiSearchFailed", "multiSearchPendingId", "searchPendingId", "orderLookupRequestId", "orderLookupReference", "offerRefreshRequestId", "offerRefreshOfferId", "seatMapRequestId", "seatMapOfferId", "paymentPrepareRequestId", "paymentPrepareOfferId", "orderCreateRequestId", "orderCreateOfferId", "selectedOffer", "seatMaps", "selectedServices",
      "alteaWorkspace", "selectedPassengerId", "selectedOrder", "cancellation", "customerRefundRequired",
      "changeRequestId", "changeOffers", "pendingChange", "paymentPurpose", "payment", "servicingRequests", "servicingReconciliation", "cancellationQuoteOrderId",
      "bookingDocuments", "documentCatalog",
      "clubSelectedCustomerId", "clubSearchLoaded", "clubSearchType", "clubMembershipFilter",
      "clubSearchResults", "clubProfiles", "clubSearchText", "customerProfileDetail",
      "stayResults", "stayRates", "selectedStayResult", "selectedStayRate", "stayQuote",
      "carResults", "carQuote", "selectedCarRate", "carClientKey", "carCardValid", "carThreeDSecureSessionId",
      "seatWorkbench", "hotelChildAges", "hotelAmenities", "hotelSearchDraft", "carSearchDraft",
      "packageTransferEntityId", "_pendingTransferDetails", "_pendingTransferEntityId",
      "travelerDrafts", "agentFop", "_apisOfferId", "_lastAutomationTravelers", "_lastFopSummary",
      "travelDecision", "generatedDocuments", "manifestMode", "dcsSelectedPassengerId"
    ];
    const requestSessionById = new Map();
    const GLOBAL_REQUEST_TYPES = new Set([
      "DUFFEL_APP_READY", "DUFFEL_LIST_ORDERS", "ALTEA_UNIFIED_BOOTSTRAP",
      "INVENTORY_SEARCH_SELLABLE", "ALTEA_SEARCH_BOOKINGS", "ALTEA_ENTERPRISE_MODULE_READY",
      "ALTEA_TRANSFER_DCS_BOOTSTRAP", "ALTEA_TRANSFER_DCS_UPDATE_DEPARTURE",
      "ALTEA_TRANSFER_DCS_UPDATE_PASSENGER", "ALTEA_TRANSFER_DCS_RECORD_DOCUMENT"
    ]);
    const RETRIEVAL_REQUEST_TYPES = new Set(["DUFFEL_GET_ORDER", "ALTEA_GET_BOOKING"]);
    let sessionUiSuspended = 0;
    let messageRouteRestoreSessionId = "";
    let messageRouteTargetSessionId = "";

    function cloneSessionValue(value, seen = new WeakMap()) {
      if (value === null || typeof value !== "object") return value;
      if (value instanceof Date) return new Date(value.getTime());
      if (value instanceof Map) return new Map(Array.from(value.entries(), ([k, v]) => [cloneSessionValue(k, seen), cloneSessionValue(v, seen)]));
      if (value instanceof Set) return new Set(Array.from(value, (item) => cloneSessionValue(item, seen)));
      if (Array.isArray(value)) return value.map((item) => cloneSessionValue(item, seen));
      if (seen.has(value)) return seen.get(value);
      const proto = Object.getPrototypeOf(value);
      if (proto !== Object.prototype && proto !== null) return value;
      const out = {};
      seen.set(value, out);
      for (const [key, item] of Object.entries(value)) out[key] = cloneSessionValue(item, seen);
      return out;
    }

    function freshSessionState(startView = "search") {
      return {
        __kind: "pnr",
        __createdAt: Date.now(),
        activeView: startView,
        search: null,
        offers: [],
        multiSearchActive:false,
        multiSearchQueue:[],
        multiSearchCompleted:0,
      multiSearchFailed:0,
      multiSearchPendingId:"",
      searchPendingId:"",
        orderLookupRequestId:"",
        orderLookupReference:"",
        offerRefreshRequestId:"",
        offerRefreshOfferId:"",
        seatMapRequestId:"",
        seatMapOfferId:"",
        orderCreateRequestId:"",
        orderCreateOfferId:"",
        selectedOffer: null,
        seatMaps: [],
        selectedServices: new Map(),
        alteaWorkspace: null,
        selectedPassengerId: "",
        selectedOrder: null,
        cancellation: null,
        customerRefundRequired: false,
        changeRequestId: "",
        changeOffers: [],
        pendingChange: null,
        servicingRequests: { cancellationQuote:null, cancellationConfirm:null, changeSearch:null, changeCreate:null, changePayment:null, changeConfirm:null },
        servicingReconciliation: null,
        cancellationQuoteOrderId: "",
        paymentPurpose: null,
        payment: null,
        bookingDocuments: [],
        documentCatalog: [],
        clubSelectedCustomerId: "",
        clubSearchLoaded: false,
        clubSearchType: "all",
        clubMembershipFilter: "all",
        clubSearchResults: [],
        clubProfiles: {},
        clubSearchText: "",
        customerProfileDetail: null,
        stayResults: [],
        stayRates: [],
        selectedStayResult: null,
        selectedStayRate: null,
        stayQuote: null,
        carResults: [],
        carQuote: null,
        selectedCarRate: null,
        carClientKey: "",
        carCardValid: false,
        carThreeDSecureSessionId: "",
        seatWorkbench: {category:"seats",activePassengerId:"",selectedPassengerIds:[],activeSegmentId:"",filters:{},requestCradle:false,deck:""},
        hotelChildAges: [],
        hotelAmenities: {},
        hotelSearchDraft: {destination:"",checkInDate:"",checkOutDate:"",rooms:1,adults:2,chainCode:"",radiusKm:25},
        carSearchDraft: {pickup:"",dropoff:"",pickupDate:"",pickupTime:"10:00",dropoffDate:"",dropoffTime:"10:00",age:30,residence:""},
        packageTransferEntityId: "",
        _pendingTransferDetails: null,
        _pendingTransferEntityId: "",
        travelerDrafts: {},
        agentFop: {paymentType:"CC",vendor:"",approvalCode:"",dbi:"",passengerIds:[],segmentIds:[]},
        _apisOfferId: "",
        _lastAutomationTravelers: null,
        _lastFopSummary: null,
        travelDecision: null,
        generatedDocuments: [],
        manifestMode: "passengers",
        dcsSelectedPassengerId: ""
      };
    }

    function freshHomeState() {
      const home = freshSessionState("dashboard");
      home.__kind = "home";
      home.__createdAt = 0;
      return home;
    }

    state.sessions = { [AMADEUS_HOME_SESSION]: freshHomeState() };
    state.activeSessionId = AMADEUS_HOME_SESSION;

    function isHomeSession(sessionId = state.activeSessionId) {
      return sessionId === AMADEUS_HOME_SESSION;
    }

    function isPnrSession(sessionId = state.activeSessionId) {
      return Boolean(sessionId && sessionId !== AMADEUS_HOME_SESSION && state.sessions?.[sessionId]?.__kind === "pnr");
    }

    function beginSessionMessageRoute(event) {
      const message = typeof event.data === "string"
        ? (() => { try { return JSON.parse(event.data); } catch (_) { return null; } })()
        : event.data;
      if (!message || message.source !== PARENT_SOURCE) return;
      const requestId = String(message.requestId || "");
      const targetSessionId = requestSessionById.get(requestId) || "";
      if (!targetSessionId || !state.sessions?.[targetSessionId]) return;
      messageRouteTargetSessionId = targetSessionId;
      if (targetSessionId !== state.activeSessionId) {
        saveCurrentSession();
        messageRouteRestoreSessionId = state.activeSessionId;
        sessionUiSuspended += 1;
        loadSession(targetSessionId, { saveOutgoing: false, renderUi: false });
      }
    }

    function pnrTabCount() {
      return Object.entries(state.sessions || {}).filter(([id, session]) => id !== AMADEUS_HOME_SESSION && session?.__kind === "pnr").length;
    }

    function snapshotCurrentSession() {
      const current = state.sessions?.[state.activeSessionId] || (isHomeSession() ? freshHomeState() : freshSessionState(state.activeView));
      const snapshot = {
        __kind: current.__kind || (isHomeSession() ? "home" : "pnr"),
        __createdAt: current.__createdAt || Date.now()
      };
      SESSION_STATE_KEYS.forEach((key) => {
        snapshot[key] = cloneSessionValue(state[key]);
      });
      return snapshot;
    }

    function saveCurrentSession() {
      if (!state.sessions || !state.activeSessionId) return;
      state.sessions[state.activeSessionId] = snapshotCurrentSession();
    }

    function applySessionState(session) {
      if (!session) return;
      const fallback = session.__kind === "home" ? freshHomeState() : freshSessionState(session.activeView || "search");
      SESSION_STATE_KEYS.forEach((key) => {
        const value = Object.prototype.hasOwnProperty.call(session, key) ? session[key] : fallback[key];
        state[key] = cloneSessionValue(value);
      });
      state.activeView = session.activeView || (session.__kind === "home" ? "dashboard" : "search");
    }

    function syncSessionChrome() {
      if (sessionUiSuspended) return;
      const targetView = state.activeView || (isHomeSession() ? "dashboard" : "search");
      $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === targetView));
      const titleEl = $("#workspaceTabTitle");
      if (titleEl) titleEl.textContent = VIEW_TITLES[targetView] || (isHomeSession() ? "Home" : "New PNR");
    }

    function loadSession(sessionId, options = {}) {
      const { saveOutgoing = true, renderUi = true } = options;
      if (!state.sessions?.[sessionId]) return false;
      if (saveOutgoing && state.activeSessionId && state.sessions[state.activeSessionId]) saveCurrentSession();
      if (renderUi && state.activeSessionId !== sessionId) {
        try { closeModal?.(); } catch (_) {}
        try { state.stripePaymentElement?.destroy?.(); } catch (_) {}
        state.stripe = null;
        state.stripeElements = null;
        state.stripePaymentElement = null;
      }
      state.activeSessionId = sessionId;
      applySessionState(state.sessions[sessionId]);
      if (renderUi && !sessionUiSuspended) {
        if (typeof setBusy === "function") setBusy(0);
        syncSessionChrome();
        renderTabs();
        render();
      }
      return true;
    }

    function createNewSession(startView = "search", options = {}) {
      const { activate = true } = options;
      if (pnrTabCount() >= MAX_PNR_TABS) {
        toast("Tab limit reached", `Altéa allows up to ${MAX_PNR_TABS} open PNR workspaces. Close a PNR tab before opening another.`, "warning");
        return null;
      }
      if (state.activeSessionId && state.sessions[state.activeSessionId]) saveCurrentSession();
      const newId = `pnr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      state.sessions[newId] = freshSessionState(startView || "search");
      if (activate) loadSession(newId, { saveOutgoing: false, renderUi: !sessionUiSuspended });
      else renderTabs();
      return newId;
    }

    function closeSession(sessionId, event) {
      event?.stopPropagation?.();
      if (!sessionId || sessionId === AMADEUS_HOME_SESSION || !state.sessions?.[sessionId]) return;
      const unresolved = Array.from(requestSessionById).some(([requestId, owner]) =>
        owner === sessionId && state.pending.has(requestId) && EXCLUSIVE_ACTIONS.has(state.pending.get(requestId)));
      const source = sessionId === state.activeSessionId ? state : state.sessions[sessionId];
      if (unresolved || source?.orderLookupRequestId || source?.payment?.paymentIntentId || source?.paymentPrepareRequestId || source?.orderCreateRequestId) {
        toast("Booking reconciliation required", "This PNR has an active supplier operation or payment session. Complete or reconcile it before closing the tab.", "warning");
        return;
      }
      const wasActive = state.activeSessionId === sessionId;
      delete state.sessions[sessionId];
      for (const [requestId, ownerId] of requestSessionById) {
        if (ownerId === sessionId) requestSessionById.delete(requestId);
      }
      if (wasActive) loadSession(AMADEUS_HOME_SESSION, { saveOutgoing: false, renderUi: true });
      else renderTabs();
    }

    function sessionRecordLocator(sessionObj) {
      const workspace = sessionObj?.alteaWorkspace;
      const order = sessionObj?.selectedOrder;
      return workspace?.booking?.bookingReference || workspace?.booking?.pnrLocator ||
        order?.bookingReference || order?.pnrLocator || "";
    }

    function getSessionTitle(sessionObj, sessionId = "") {
      if (sessionId === AMADEUS_HOME_SESSION || sessionObj?.__kind === "home") return "Home";
      const locator = sessionRecordLocator(sessionObj);
      return locator ? `PNR ${locator}` : "New PNR";
    }

    function renderTabs() {
      if (sessionUiSuspended) return;
      const container = document.querySelector(".workspace-tabs");
      if (!container) return;
      saveCurrentSession();
      const entries = Object.entries(state.sessions || {}).sort(([a, sa], [b, sb]) => {
        if (a === AMADEUS_HOME_SESSION) return -1;
        if (b === AMADEUS_HOME_SESSION) return 1;
        return Number(sa?.__createdAt || 0) - Number(sb?.__createdAt || 0);
      });
      let html = "";
      for (const [id, session] of entries) {
        const isActive = id === state.activeSessionId;
        const home = id === AMADEUS_HOME_SESSION || session?.__kind === "home";
        const title = getSessionTitle(session, id);
        html += `<div class="ws-tab ${isActive ? "active" : ""} ${home ? "ws-tab-home" : "ws-tab-pnr"}" data-session-id="${escapeAttr(id)}" title="${escapeAttr(title)}">` +
          `<span class="ws-tab-symbol">${home ? "⌂" : "▤"}</span>` +
          `<span class="tab-title" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${escapeHTML(title)}</span>` +
          `${home ? "" : `<button class="ws-tab-close" data-close-session="${escapeAttr(id)}" aria-label="Close ${escapeAttr(title)}">×</button>`}` +
          `</div>`;
      }
      html += `<button class="ws-tab-add" data-add-session title="Create New PNR" ${pnrTabCount() >= MAX_PNR_TABS ? "disabled" : ""}>+</button>`;
      container.innerHTML = html;
      container.querySelectorAll(".ws-tab[data-session-id]").forEach((tab) => {
        tab.addEventListener("click", (event) => {
          if (event.target.closest(".ws-tab-close")) return;
          loadSession(tab.dataset.sessionId);
        });
      });
      container.querySelectorAll(".ws-tab-close").forEach((button) => {
        button.addEventListener("click", (event) => closeSession(button.dataset.closeSession, event));
      });
      container.querySelector("[data-add-session]")?.addEventListener("click", () => createNewSession("search"));
    }
    // --- END ALTÉA PAGE-TAB / PNR SESSION MANAGEMENT ---

    const main = document.getElementById("main");
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));


    function makeRequestId() {
      if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
      return `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    }


    function masterNavigate(path) {
      const safePath = String(path || "").trim();
      if (!safePath.startsWith("/")) return;
      window.parent.postMessage({source: CHILD_SOURCE, type: "MASTER_NAVIGATE", path: safePath, payload: {path: safePath}}, "*");
    }


    function post(type, payload = {}, options = {}) {
      // Retrieval from Home follows ARD Web semantics: open a record tab first,
      // then let the response populate that PNR tab.
      if (isHomeSession() && RETRIEVAL_REQUEST_TYPES.has(type)) {
        const targetView = type === "DUFFEL_GET_ORDER" ? "booking" : "booking";
        const newSessionId = createNewSession(targetView);
        if (!newSessionId) return null;
      }
      if (EXCLUSIVE_ACTIONS.has(type) && Array.from(state.pending.values()).includes(type)) {
        toast("Action already running", "Wait for the current request to finish.", "warning");
        return null;
      }
      const requestId = makeRequestId();
      if (isPnrSession() && !GLOBAL_REQUEST_TYPES.has(type)) {
        requestSessionById.set(requestId, state.activeSessionId);
      }
      if (options.busy !== false) {
        state.pending.set(requestId, type);
        setBusy(1);
      }
      if (type === "DUFFEL_GET_ORDER") {
        // Bound to the PNR created by post() above; a later lookup supersedes
        // this request even if an older supplier response completes last.
        state.orderLookupRequestId = requestId;
        state.orderLookupReference = String(payload?.orderIdOrReference || "").trim();
      }
      if (type === "DUFFEL_CREATE_ORDER") {
        state.orderCreateRequestId = requestId;
        state.orderCreateOfferId = String(payload?.offerId || "");
      }
      window.parent.postMessage({
        source: CHILD_SOURCE,
        type,
        requestId,
        payload
      }, "*");
      return requestId;
    }


    function settle(requestId) {
      if (!requestId || !state.pending.has(requestId)) return;
      state.pending.delete(requestId);
      setBusy(-1);
    }


    function setBusy(delta, customText = "COMMUNICATING WITH HOST SYSTEM...") {
      state.busyCount = Math.max(0, state.busyCount + delta);
      const visiblePending = Array.from(state.pending.entries()).filter(([requestId]) => {
        const owner = requestSessionById.get(requestId) || "";
        return isHomeSession() ? !owner : owner === state.activeSessionId;
      });
      const visibleBusy = visiblePending.length > 0;
      const busyBar = $("#busyBar");
      const loader = $("#appLoader");
      const loaderText = $("#appLoaderText");
      if (busyBar) busyBar.classList.toggle("hidden", !visibleBusy);
      if (loader) {
        loader.classList.toggle("active", visibleBusy);
        if (visibleBusy && loaderText) {
          let activeAction = visiblePending[0]?.[1] || customText;
          if (activeAction.includes("SEARCH")) activeAction = "QUERYING AIR AVAILABILITY / SELLING PLATFORM CONNECT...";
          else if (activeAction.includes("PAYMENT")) activeAction = "ESTABLISHING SECURE PAYMENT SESSION (PCI-DSS)...";
          else if (activeAction.includes("ORDER")) activeAction = "COMMITTING PNR TO LIVE AIRLINE INVENTORY...";
          else if (activeAction.includes("STAY") || activeAction.includes("HOTEL")) activeAction = "RETRIEVING LIVE HOTEL INVENTORY...";
          loaderText.textContent = activeAction;
        }
      }
    }


    function navigate(view) {
      if (!VIEW_TITLES[view]) return;

      // While an asynchronous response is being applied to a background PNR,
      // update only that session state. The visible tab is restored after all
      // existing message listeners have finished.
      if (sessionUiSuspended) {
        state.activeView = view;
        if (state.sessions?.[state.activeSessionId]) state.sessions[state.activeSessionId].activeView = view;
        return;
      }

      if (isHomeSession()) {
        if (PNR_PRODUCT_VIEWS.has(view)) {
          createNewSession(view);
          return;
        }
        if (PNR_INTERNAL_VIEWS.has(view)) {
          toast("Open a PNR first", "Create or retrieve a PNR before opening a booking-file function.", "warning");
          return;
        }
      } else if (isPnrSession()) {
        if (GLOBAL_ONLY_VIEWS.has(view)) {
          toast("PNR workspace active", "Switch to Home to use global tools. This tab remains dedicated to its PNR.", "warning");
          return;
        }
        if (PNR_REQUIRES_BOOKING_VIEWS.has(view) && !state.alteaWorkspace?.booking) {
          toast("PNR not saved yet", "Add a product or create the booking file before opening this PNR function.", "warning");
          return;
        }
      }

      state.activeView = view;
      if (state.sessions?.[state.activeSessionId]) state.sessions[state.activeSessionId].activeView = view;
      saveCurrentSession();
      syncSessionChrome();
      renderTabs();
      render();
    }


    function render() {
      const renderers = {
        dashboard: renderDashboard,
        search: renderSearch,
        offer: renderOffer,
        workspace: renderWorkspace,
        orders: renderOrders,
        booking: renderBookingFile,
        passengers: renderPassengers,
        services: renderServices,
        ticketing: renderTicketing,
        actions: renderActions,
        baggage: renderBaggageBoarding,
        requirements: renderRequirements,
        history: renderHistory,
        reports: renderReports,
        preferences: renderPreferences
      };
      main.innerHTML = `<section class="view">${renderers[state.activeView]()}</section>`;
      bindViewEvents();
      renderTabs(); // <--- ADD THIS LINE
      bindViewEvents();
      // Booking-document functions are surfaced through the unified Ticketing/Documents module.
    }




    function pageHead(title, subtitle, actions = "") {
      return `<div class="page-head">
        <div><h1>${escapeHTML(title)}</h1><p>${escapeHTML(subtitle)}</p></div>
        <div class="head-actions">${actions}</div>
      </div>`;
    }


    function renderDashboard() {
      const confirmed = state.orders.filter((order) => order.status === "confirmed").length;
      const cancelled = state.orders.filter((order) => order.cancelledAt || order.status === "cancelled").length;
      const total = state.orders.reduce((sum, order) => {
        if (order.totalCurrency !== state.preferences.currency) return sum;
        return sum + Number(order.totalAmount || 0);
      }, 0);
      const latest = state.orders.slice(0, 8);


      return `
        ${pageHead("ALTEA Dashboard", "One booking workspace for live Flights. Hotels & Cars, Inventory Control capacity, SKANDI Club, documents and transfer operations.",
          '<button class="secondary" data-action="refresh-all">Refresh</button><button class="primary" data-view="search">New booking</button>')}
        ${!state.bridgeConnected ? alertBox("info", "Connecting", "Waiting for the secure system bridge.") : (!state.connected ? alertBox("info", "Bridge connected", "Secure Wix bridge is online. Initializing ALTEA services…") : "")}
        <div class="grid grid-4">
          ${statCard("Supplier orders", state.orders.length, "Loaded orders")}
          ${statCard("ALTEA bookings", state.alteaBookings.length, "Internal booking files")}
          ${statCard("Cancelled", cancelled, "Cancelled in loaded result set")}
          ${statCard(`Gross (${state.preferences.currency})`, money(total, state.preferences.currency), "Same-currency orders only")}
        </div>
        <div class="dashboard-layout" style="margin-top:10px">
          <section class="panel">
            <div class="panel-head"><span>Recent orders</span><button class="link" data-view="orders">Open all</button></div>
            <div class="panel-body" style="padding:0">${orderTable(latest)}</div>
          </section>
          <section class="panel">
            <div class="panel-head">Quick actions</div>
            <div class="panel-body">
              <div class="quick-actions">
                <button class="quick-action" data-view="search"><b>Search flights</b><span class="muted">Create a live offer request.</span></button>
                <button class="quick-action" data-view="orders"><b>Retrieve booking</b><span class="muted">Search SKANDI or supplier references.</span></button>
                <button class="quick-action" data-view="passengers"><b>Passenger management</b><span class="muted">APIS, documents, seat and operational status.</span></button>
                <button class="quick-action" data-view="ticketing"><b>Ticketing & documents</b><span class="muted">Supplier-issued air documents and SKANDI forms.</span></button>
              </div>
            </div>
          </section>
        </div>`;
    }


    function renderSearch() {
      const today = new Date();
      today.setDate(today.getDate() + 1);
      const returnDate = new Date(today);
      returnDate.setDate(returnDate.getDate() + 7);
      const saved = state.search || {};


      return `
        ${pageHead("Flight Search", "Search live airline offer requests.")}
        <section class="panel">
          <div class="panel-head">Air availability</div>
          <form id="flightSearchForm" class="panel-body">
            <div class="search-form">
              <div class="field">
                <label for="tripType">Trip</label>
                <select id="tripType">
                  <option value="round_trip" ${saved.tripType === "one_way" ? "" : "selected"}>Round trip</option>
                  <option value="one_way" ${saved.tripType === "one_way" ? "selected" : ""}>One way</option>
                  <option value="multi_search" ${saved.tripType === "multi_search" ? "selected" : ""}>Multi-search (independent flights)</option>
                </select>
              </div>
              <div class="field">
                <label for="origin">From (IATA)</label>
                <input id="origin" maxlength="3" autocomplete="off" placeholder="JFK" value="${escapeAttr(saved.origin || "")}" required>
              </div>
              <button class="secondary" type="button" data-action="swap-airports" aria-label="Swap airports"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 3 4 4-4 4"></path><path d="M20 7H4"></path><path d="m8 21-4-4 4-4"></path><path d="M4 17h16"></path></svg></button>
              <div class="field">
                <label for="destination">To (IATA)</label>
                <input id="destination" maxlength="3" autocomplete="off" placeholder="CPH" value="${escapeAttr(saved.destination || "")}" required>
              </div>
              <div class="field">
                <label for="departureDate">Depart</label>
                <input id="departureDate" type="date" min="${isoDate(new Date())}" value="${saved.departureDate || isoDate(today)}" required>
              </div>
              <div class="field" id="returnDateField">
                <label for="returnDate">Return</label>
                <input id="returnDate" type="date" min="${isoDate(today)}" value="${saved.returnDate || isoDate(returnDate)}">
              </div>
              <button class="primary" type="submit">Search flights</button>
            </div>
            <div class="field hidden" id="multiSearchField" style="margin:8px 0">
              <label for="multiSearchInput">Independent routes (one per line: ORIGIN DESTINATION YYYY-MM-DD; maximum 8)</label>
              <textarea id="multiSearchInput" rows="4" placeholder="JFK LAX 2026-11-20" spellcheck="false">${escapeHTML(saved.multiSearchInput||"")}</textarea>
              <small class="muted">Each line is a separate live Duffel offer request. This is not multi-city ticketing or a combined fare.</small>
            </div>
            <div class="search-options">
              <div class="field">
                <label for="adults">Adults</label>
                <select id="adults">${numberOptions(1, 9, Number(saved.adults || 1))}</select>
              </div>
              <div class="field">
                <label for="childAges">Child ages (2–17)</label>
                <input id="childAges" autocomplete="off" placeholder="8, 14" value="${escapeAttr((saved.childAges || []).join(", "))}">
              </div>
              <div class="field">
                <label for="infantAges">Infant ages (0–1)</label>
                <input id="infantAges" autocomplete="off" placeholder="0" value="${escapeAttr((saved.infantAges || []).join(", "))}">
              </div>
              <div class="field">
                <label for="cabinClass">Cabin</label>
                <select id="cabinClass">
                  ${option("economy", "Economy", saved.cabinClass || "economy")}
                  ${option("premium_economy", "Premium economy", saved.cabinClass)}
                  ${option("business", "Business", saved.cabinClass)}
                  ${option("first", "First", saved.cabinClass)}
                </select>
              </div>
              <div class="field">
                <label for="maxConnections">Connections per slice</label>
                <select id="maxConnections">
                  ${option("0", "Direct only", String(saved.maxConnections ?? 1))}
                  ${option("1", "Up to 1", String(saved.maxConnections ?? 1))}
                  ${option("2", "Up to 2", String(saved.maxConnections ?? 1))}
                </select>
              </div>
              <div class="field">
              <label for="currency">Display currency</label><select id="currency" class="input">
              <option value="SEK" ${state.preferences.currency === 'SEK' ? 'selected' : ''}>SEK - Swedish Krona (Sweden)</option>
              <option value="USD" ${state.preferences.currency === 'USD' ? 'selected' : ''}>USD - US Dollar (United States)</option>
              <option value="EUR" ${state.preferences.currency === 'EUR' ? 'selected' : ''}>EUR - Euro (Eurozone)</option>
              <option value="DKK" ${state.preferences.currency === 'DKK' ? 'selected' : ''}>DKK - Danish Krone (Denmark)</option>
              <option value="NOK" ${state.preferences.currency === 'NOK' ? 'selected' : ''}>NOK - Norwegian Krone (Norway)</option>
              </select>
              </div>
            </div>
            <div class="panel" style="margin-top:12px" aria-label="Local departure and arrival time filters">
              <div class="panel-head">Departure / arrival time windows</div>
              <div class="panel-body">
                <p class="muted" style="margin:0 0 9px">Optional filters on <strong>returned Duffel offers</strong>, using each airport's local scheduled time. These filters are not submitted to the airline and cannot retrieve additional offers. Leave time fields blank to show every returned fare.</p>
                <div class="search-options">
                  <div class="field"><label for="outDepartureFrom">Outbound departure from</label><input type="time" id="outDepartureFrom" value="${escapeAttr(saved.timeFilters?.outDepartureFrom||"")}"></div>
                  <div class="field"><label for="outDepartureTo">Outbound departure to</label><input type="time" id="outDepartureTo" value="${escapeAttr(saved.timeFilters?.outDepartureTo||"")}"></div>
                  <div class="field"><label for="outArrivalFrom">Outbound arrival from</label><input type="time" id="outArrivalFrom" value="${escapeAttr(saved.timeFilters?.outArrivalFrom||"")}"></div>
                  <div class="field"><label for="outArrivalTo">Outbound arrival to</label><input type="time" id="outArrivalTo" value="${escapeAttr(saved.timeFilters?.outArrivalTo||"")}"></div>
                </div>
                <div id="returnTimeFilters" style="margin-top:9px">
                  <div class="search-options">
                    <div class="field"><label for="inDepartureFrom">Return departure from</label><input type="time" id="inDepartureFrom" value="${escapeAttr(saved.timeFilters?.inDepartureFrom||"")}"></div>
                    <div class="field"><label for="inDepartureTo">Return departure to</label><input type="time" id="inDepartureTo" value="${escapeAttr(saved.timeFilters?.inDepartureTo||"")}"></div>
                    <div class="field"><label for="inArrivalFrom">Return arrival from</label><input type="time" id="inArrivalFrom" value="${escapeAttr(saved.timeFilters?.inArrivalFrom||"")}"></div>
                    <div class="field"><label for="inArrivalTo">Return arrival to</label><input type="time" id="inArrivalTo" value="${escapeAttr(saved.timeFilters?.inArrivalTo||"")}"></div>
                  </div>
                </div>
                <small class="muted">Time intervals can span midnight, for example 22:00–05:00. Return fields apply only to round-trip results.</small>
              </div>
            </div>
          </form>
        </section>
        <div style="margin-top:10px">
          ${state.offers.length ? renderOfferResults() : emptyState("✈", "No live offers loaded", "Run a search to load current offers.")}
        </div>`;
    }


    function readOfferTimeFilters(tripType){
      const keys=["outDepartureFrom","outDepartureTo","outArrivalFrom","outArrivalTo"];
      if(tripType==="round_trip")keys.push("inDepartureFrom","inDepartureTo","inArrivalFrom","inArrivalTo");
      const result={};
      for(const key of keys){
        const value=String(document.getElementById(key)?.value||"").trim();
        if(value&&!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)){
          toast("Invalid time filter","Enter a valid 24-hour time for "+key+".","warning");
          return null;
        }
        if(value)result[key]=value;
      }
      return result;
    }
    function offerAirportLocalTime(value){
      const match=String(value||"").match(/T([01]\d|2[0-3]):([0-5]\d)/);
      return match?match[1]+":"+match[2]:null;
    }
    function offerTimeInWindow(value,from,to){
      if(!from&&!to)return true;
      const local=offerAirportLocalTime(value);
      if(!local)return false;
      if(from&&to&&from>to)return local>=from||local<=to;
      return (!from||local>=from)&&(!to||local<=to);
    }
    function matchesOfferTimeFilters(offer,filters){
      const slices=Array.isArray(offer?.slices)?offer.slices:[];
      for(const [index,prefix] of [[0,"out"],[1,"in"]]){
        const fromDeparture=filters?.[prefix+"DepartureFrom"]||"";
        const toDeparture=filters?.[prefix+"DepartureTo"]||"";
        const fromArrival=filters?.[prefix+"ArrivalFrom"]||"";
        const toArrival=filters?.[prefix+"ArrivalTo"]||"";
        if(!fromDeparture&&!toDeparture&&!fromArrival&&!toArrival)continue;
        const segments=Array.isArray(slices[index]?.segments)?slices[index].segments:[];
        if(!segments.length)return false;
        if(!offerTimeInWindow(segments[0]?.departingAt,fromDeparture,toDeparture))return false;
        if(!offerTimeInWindow(segments[segments.length-1]?.arrivingAt,fromArrival,toArrival))return false;
      }
      return true;
    }
    function renderOfferResults() {
      // Client-side narrowing of supplier-returned offers only: Duffel search remains unfiltered.
      const filters=state.search?.timeFilters||{};
      const filteredOffers=state.offers.filter(offer=>matchesOfferTimeFilters(offer,filters));
      const activeFilters=Object.keys(filters).length>0;
      // Group offers by flight schedule (Origin -> Destination & Departure Time)
      const groupedOffers = {};
      filteredOffers.forEach(offer => {
        const key = (offer.slices || []).map(slice => (slice.segments || []).map(seg => [seg.origin?.iataCode,seg.destination?.iataCode,seg.departingAt,seg.arrivingAt,seg.marketingCarrier?.iataCode,seg.marketingFlightNumber].join(":" )).join("|")).join(" / ");
        if (!groupedOffers[key]) groupedOffers[key] = [];
        groupedOffers[key].push(offer);
      });

      const flightGroups = Object.values(groupedOffers);

      return `<div class="offer-layout">
        <section>
          <div class="panel-head">
            <span>${flightGroups.length} flight option(s) · ${filteredOffers.length}${activeFilters?` of ${state.offers.length}`:""} returned fares${state.multiSearchActive?` · ${state.multiSearchCompleted} completed, ${state.multiSearchQueue.length} queued, ${state.multiSearchFailed} failed`:""}</span>
            <span class="muted">${activeFilters?"Filtered locally · not airline search criteria":"Grouped by schedule"}</span>
          </div>
          <div style="margin-top:8px">
            ${activeFilters?`<p class="muted" role="status">${filteredOffers.length} of ${state.offers.length} supplier-returned offers meet the selected local-airport time windows. This filtering does not change the Duffel request or guarantee all matching airline inventory was returned.</p>`:""}
            ${filteredOffers.length?flightGroups.map(group => renderNestedFlightGroup(group)).join(""):emptyState("✈","No offers meet these time windows","Try wider time windows or a fresh supplier search. Only the currently returned offers were filtered.")}
          </div>
        </section>
        <aside class="panel sticky">
          <div class="panel-head">Booking sequence</div>
          <div class="panel-body">
            ${stepLine(true, "1", "Search returned live offers")}
            ${stepLine(false, "2", "Refresh selected offer")}
            ${stepLine(false, "3", "Add traveler details and services")}
            ${stepLine(false, "4", "Secure payment")}
            ${stepLine(false, "5", "Create order")}
          </div>
        </aside>
      </div>`;
    }

    // Fare comparison reads only the supplier-normalized offers already returned to this session.
    // It never combines independently priced offers into a ticket, or invents an upsell.
    function fareSupplierFacts(offer) {
      const currency=offer.totalCurrency||"";
      const taxLines=Array.isArray(offer.taxBreakdown)?offer.taxBreakdown:[];
      const slices=Array.isArray(offer.slices)?offer.slices:[];
      const passengers=slices.flatMap(slice=>(slice.segments||[]).flatMap(segment=>(segment.passengers||[]).map(p=>({
        segment:`${segment.origin?.iataCode||"?"}-${segment.destination?.iataCode||"?"}`,
        fareBasis:p.fareBasisCode||"",
        cabin:p.cabinClassMarketingName||p.cabinClass||"",
        baggage:Array.isArray(p.baggages)?p.baggages:[],
        amenities:p.cabinAmenities||p.cabin?.amenities||null
      }))));
      const rules=offer.conditions||{};
      const conditions=rule=>{
        if(!rule||typeof rule!=="object")return "Not supplied";
        const allowed=rule.allowed===true?"Allowed":rule.allowed===false?"Not allowed":"Not specified";
        const penalty=rule.penaltyAmount??rule.penalty_amount;
        const penaltyCurrency=rule.penaltyCurrency||rule.penalty_currency||currency;
        return penalty===null||penalty===undefined?allowed:`${allowed}; penalty ${money(penalty,penaltyCurrency)}`;
      };
      const bagText=b=>{
        const weight=b.weight??b.weightKg??null;
        return [b.type||"Baggage",b.quantity!=null?`${b.quantity} piece(s)`:"",weight!=null?`${weight} ${b.weightUnit||b.weight_unit||""}`.trim():""].filter(Boolean).join(" · ");
      };
      return `<details class="altea-fare-facts"><summary>Included services, fare conditions and itemized pricing</summary>
        <div class="altea-fare-facts-content">
          ${offer.baseAmount!=null?`<div class="money-line"><span>Supplier base amount</span><strong>${escapeHTML(money(offer.baseAmount,offer.baseCurrency||currency))}</strong></div>`:""}
          ${offer.taxAmount!=null?`<div class="money-line"><span>Supplier tax amount</span><strong>${escapeHTML(money(offer.taxAmount,offer.taxCurrency||currency))}</strong></div>`:""}
          <div class="money-line"><span>Complete supplier offer</span><strong>${escapeHTML(money(offer.totalAmount,currency))}</strong></div>
          ${offer.totalEmissionsKg!=null?`<div class="money-line"><span>Estimated CO₂ emissions</span><strong>${escapeHTML(String(offer.totalEmissionsKg))} kg</strong></div>`:""}
          ${slices.some(slice=>slice.comparisonKey||slice.ngsShelf!=null)?`<div class="money-line"><span>Supplier itinerary reference</span><strong class="mono">${escapeHTML(slices.map(slice=>[slice.comparisonKey,slice.ngsShelf].filter(v=>v!==null&&v!==undefined).join(" / ")).filter(Boolean).join(" · "))}</strong></div>`:""}
          <div class="money-line"><span>Change before departure</span><strong>${escapeHTML(conditions(rules.change_before_departure||rules.changeBeforeDeparture))}</strong></div>
          <div class="money-line"><span>Refund before departure</span><strong>${escapeHTML(conditions(rules.refund_before_departure||rules.refundBeforeDeparture))}</strong></div>
          ${passengers.length?`<details class="altea-fare-subdetails"><summary>Segment/passenger fare basis, baggage and cabin amenities</summary><table class="data-table"><thead><tr><th>Flight</th><th>Fare basis</th><th>Cabin</th><th>Included baggage</th><th>Cabin amenities</th></tr></thead><tbody>${passengers.map(p=>`<tr><td>${escapeHTML(p.segment)}</td><td class="mono">${escapeHTML(p.fareBasis||"Not supplied")}</td><td>${escapeHTML(p.cabin||"Not supplied")}</td><td>${escapeHTML(p.baggage.length?p.baggage.map(bagText).join("; "):"Not specified")}</td><td class="mono">${escapeHTML(p.amenities?JSON.stringify(p.amenities):"Not supplied")}</td></tr>`).join("")}</tbody></table></details>`:""}
          ${taxLines.length?`<details class="altea-fare-subdetails"><summary>Supplier tax breakdown (${taxLines.length} lines)</summary>${taxLines.map(t=>`<div class="money-line"><span>${escapeHTML([t.name||t.code||"Tax",t.code&&t.name?`(${t.code})`:"",t.description||"",t.carrier_imposed===true||t.carrierImposed===true?"Carrier-imposed":""].filter(Boolean).join(" · "))}</span><strong>${t.amount!=null?escapeHTML(money(t.amount,t.currency||offer.taxCurrency||currency)):"Not supplied"}</strong></div>`).join("")}</details>`:""}
          ${Array.isArray(offer.supportedLoyaltyProgrammes)&&offer.supportedLoyaltyProgrammes.length?`<div class="money-line"><span>Supported loyalty programmes</span><strong>${escapeHTML(offer.supportedLoyaltyProgrammes.map(p=>typeof p==="string"?p:p.iataCode||p.airline_iata_code||p.name||"").filter(Boolean).join(", "))}</strong></div>`:""}
          ${offer.priceGuaranteeExpiresAt?`<div class="money-line"><span>Price guarantee expires</span><strong>${escapeHTML(formatDateTime(offer.priceGuaranteeExpiresAt))}</strong></div>`:""}
          ${offer.paymentRequiredBy?`<div class="money-line"><span>Payment required by</span><strong>${escapeHTML(formatDateTime(offer.paymentRequiredBy))}</strong></div>`:""}
          <small class="muted">These are supplier-returned details for this specific offer, not a comparison generated by the airline's upsell or grouped-itinerary API. Prices are not converted between currencies.</small>
        </div>
      </details>`;
    }

    function renderNestedFlightGroup(groupOffers) {
      const baseOffer = groupOffers[0];
      const carrierNames = unique(
        baseOffer.slices.flatMap((slice) =>
          slice.segments.map((segment) => segment.operatingCarrier?.name || segment.operating_carrier?.name).filter(Boolean)
        )
      );
      const aircraftNames = unique(
        baseOffer.slices.flatMap((slice) =>
          slice.segments.map((segment) => segment.aircraft?.name || segment.aircraft?.iata_code || segment.aircraft?.iataCode).filter(Boolean)
        )
      );

      const carrierCode = baseOffer.owner?.iata_code || baseOffer.owner?.iataCode || baseOffer.slices?.[0]?.segments?.[0]?.marketingCarrier?.iataCode || "";
      const logoUrl = baseOffer.owner?.logo_symbol_url || baseOffer.owner?.logo_lockup_url || (carrierCode ? `https://images.kiwi.com/airlines/64/${carrierCode}.png` : "");
      const logoMarkup = logoUrl ? `<img src="${escapeAttr(logoUrl)}" alt="" style="height: 20px; object-fit: contain; margin-bottom: 3px;">` : "";

      const slicesMarkup = baseOffer.slices.map((slice, idx) => {
        const first = slice.segments[0];
        const last = slice.segments[slice.segments.length - 1];
        return `<div class="offer-slice">
          <strong>Slice ${idx + 1}: ${escapeHTML(slice.origin?.iataCode || first?.origin?.iataCode || "—")} → ${escapeHTML(slice.destination?.iataCode || last?.destination?.iataCode || "—")}</strong>
          <span class="muted"> · ${formatDateTime(first?.departingAt)} – ${formatDateTime(last?.arrivingAt)} · ${slice.segments.length - 1} stop(s)</span>
        </div>`;
      }).join("");

      // Group same-schedule live supplier offers by the returned fare brand/cabin.
      // Where fare brand/cabin are missing, preserve the offer and show it as unclassified.
      const priced=groupOffers.slice().sort((a,b)=>{
        const ac=a.totalCurrency||"",bc=b.totalCurrency||"";
        if(ac!==bc)return ac.localeCompare(bc);
        const ap=Number(a.totalAmount),bp=Number(b.totalAmount);
        return Number.isFinite(ap)&&Number.isFinite(bp)?ap-bp:0;
      });
      const fareRows=priced.map(offer=>{
        const brands=(offer.slices||[]).map(slice=>slice.fareBrandName||slice.fare_brand_name).filter(Boolean);
        const brand=[...new Set(brands)].join(" / ")||"Fare brand not supplied";
        const passenger=offer.slices?.[0]?.segments?.[0]?.passengers?.[0]||{};
        const cabin=passenger.cabinClassMarketingName||passenger.cabinClass||"Cabin not supplied";
        const comparable=priced.find(other=>other.totalCurrency===offer.totalCurrency&&Number.isFinite(Number(other.totalAmount)));
        const gap=comparable&&Number.isFinite(Number(offer.totalAmount))
          ?Number(offer.totalAmount)-Number(comparable.totalAmount):null;
        const logoOwner=offer.owner?.name||offer.owner?.iataCode||"";
        return `<div class="altea-fare-variant">
          <div class="altea-fare-variant-header">
            <div class="altea-fare-name"><strong>${escapeHTML(brand)}</strong><span>${escapeHTML(cabin)}</span>${logoOwner?`<span>${escapeHTML(logoOwner)}</span>`:""}</div>
            <div class="altea-fare-price"><strong>${escapeHTML(money(offer.totalAmount,offer.totalCurrency))}</strong>${gap!==null&&gap>0?`<small>+ ${escapeHTML(money(gap,offer.totalCurrency))} vs lowest ${escapeHTML(offer.totalCurrency)} offer</small>`:""}</div>
            <button class="primary" data-action="select-offer" data-offer-id="${escapeAttr(offer.id)}" ${skandiDuffelOfferExpiredNow(offer)?"disabled":""}>Select fare</button>
          </div>
          <div class="altea-fare-variant-terms"><span>${escapeHTML(expiryLabel(offer.expiresAt))}</span><span>Offer <code>${escapeHTML(offer.id||"—")}</code></span></div>
          ${fareSupplierFacts(offer)}
        </div>`;
      }).join("");

      return `<article class="offer-row" style="margin-bottom: 12px;">
        <div style="padding: 10px; background: #f5f7f8; border-bottom: 1px solid var(--line); display: flex; align-items: center; gap: 10px;">
          ${logoMarkup}
          <div style="flex: 1;">${slicesMarkup}</div>
        </div>
        <div>${fareRows}</div>
        <div class="carrier-disclosure" style="font-size: 9px; padding: 5px 10px;">
          <strong>Operated by:</strong> ${escapeHTML(carrierNames.join(", ") || "Carrier pending")} — <strong>Aircraft:</strong> ${escapeHTML(aircraftNames.join(", ") || "Aircraft pending")}
        </div>
      </article>`;
    }

    function offerCard(offer) {
      // Extract unique operating carriers & carrier code
      const carrierCode = offer.owner?.iata_code || offer.owner?.iataCode || offer.slices?.[0]?.segments?.[0]?.marketingCarrier?.iataCode || "";
      const carrierNames = unique(
        offer.slices.flatMap((slice) =>
          slice.segments.map((segment) => segment.operatingCarrier?.name || segment.operating_carrier?.name).filter(Boolean)
        )
      );

      // Extract unique aircraft names/codes
      const aircraftNames = unique(
        offer.slices.flatMap((slice) =>
          slice.segments.map((segment) => segment.aircraft?.name || segment.aircraft?.iata_code || segment.aircraft?.iataCode).filter(Boolean)
        )
      );

      // Robust Multi-Source Logo URL (Duffel native -> Public IATA CDN fallback)
      const logoUrl = offer.owner?.logo_symbol_url || offer.owner?.logo_lockup_url || (carrierCode ? `https://images.kiwi.com/airlines/64/${carrierCode}.png` : "");
      const logoMarkup = logoUrl 
        ? `<img src="${escapeAttr(logoUrl)}" alt="${escapeAttr(offer.owner?.name || carrierCode || 'Airline')}" style="height: 24px; max-width: 60px; object-fit: contain; margin-bottom: 4px; display: block;" onerror="this.style.display='none'">` 
        : "";

      const slices = offer.slices.map((slice) => {
        const first = slice.segments[0];
        const last = slice.segments[slice.segments.length - 1];
        
        const fareBrand = slice.fareBrandName || slice.fare_brand_name;
        const cabinClassRaw = first?.passengers?.[0]?.cabinClassMarketingName || first?.passengers?.[0]?.cabinClass || first?.passengers?.[0]?.cabin_class;
        const cabinClass = cabinClassRaw ? humanize(cabinClassRaw) : "Economy";
        const fareDisplay = [cabinClass, fareBrand].filter(Boolean).join(" · ");

        return `<div class="offer-slice">
          <div style="margin-bottom: 3px; display: flex; align-items: center; gap: 8px;">
            <strong>${escapeHTML(slice.origin?.iataCode || first?.origin?.iataCode || "—")} → ${escapeHTML(slice.destination?.iataCode || last?.destination?.iataCode || "—")}</strong>
            <span class="badge info">${escapeHTML(fareDisplay)}</span>
          </div>
          <span class="muted">${formatDateTime(first?.departingAt)} – ${formatDateTime(last?.arrivingAt)} · ${slice.segments.length - 1} stop${slice.segments.length - 1 === 1 ? "" : "s"}</span>
        </div>`;
      }).join("");

      return `<article class="offer-row">
        <div class="offer-summary">
          <div class="offer-price">
            ${logoMarkup}
            <strong>${money(offer.totalAmount, offer.totalCurrency)}</strong>
            <span class="muted">Total offer</span>
          </div>
          <div class="offer-route">${slices}</div>
          <div class="offer-action">
            <span class="badge ${expiryClass(offer.expiresAt)}">${expiryLabel(offer.expiresAt)}</span>
            <button class="primary" data-action="select-offer" data-offer-id="${escapeAttr(offer.id)}">Review &amp; refresh</button>
          </div>
        </div>
        <div class="carrier-disclosure">
          <strong>Operated by:</strong> ${escapeHTML(carrierNames.join(", ") || "Operating carrier pending")}
          — <strong>Aircraft:</strong> ${escapeHTML(aircraftNames.join(", ") || "Aircraft pending")}
        </div>
      </article>`;
    }

    function renderOffer() {
      const offer = state.selectedOffer;
      if (!offer) {
        return `${pageHead("Offer Review", "A selected offer is refreshed here before checkout.")}
          ${emptyState("▤", "No offer selected", "Search for flights and choose an offer to review.")}`;
      }
      return `
        ${pageHead("Offer Review", "This price was refreshed before traveler details or payment.",
          '<button class="secondary" data-action="refresh-selected-offer">Refresh price</button><button class="primary" data-view="workspace">Continue to order</button>')}
        ${skandiDuffelOfferExpiredNow(offer) ? alertBox("danger", "Offer expired", "Return to flight search and choose a current offer.") : ""}
        <div class="workspace-layout">
          <div>
            ${itineraryMarkup(offer)}
            <section class="panel" style="margin-top:10px">
              <div class="panel-head">Available baggage and services</div>
              <div class="panel-body" style="padding:0">${serviceListMarkup(offer.availableServices || [])}</div>
            </section>
            <section class="panel" style="margin-top:10px">
              <div class="panel-head"><span>Seat maps</span><button class="link" data-action="load-seat-maps">Refresh seat maps</button></div>
              <div class="panel-body">${seatMapMarkup()}</div>
            </section>
          </div>
          <aside class="panel sticky">
            <div class="panel-head">Current price</div>
            <div class="panel-body">
              <div class="money-line"><span>Offer</span><strong>${money(offer.totalAmount, offer.totalCurrency)}</strong></div>
              <div class="money-line"><span>Selected services</span><strong>${money(selectedServiceTotal(), offer.totalCurrency)}</strong></div>
              <div class="money-line"><span>Total due</span><strong class="price-total">${money(orderTotal(), offer.totalCurrency)}</strong></div>
              <div class="money-line"><span>Expires</span><strong>${formatDateTime(offer.expiresAt)}</strong></div>
              <div class="money-line"><span>Payment</span><strong>${offer.requiresInstantPayment ? "Instant required" : "Instant or hold"}</strong></div>
            </div>
            <div class="panel-foot"><button class="primary" data-view="workspace" ${skandiDuffelOfferExpiredNow(offer) ? "disabled" : ""}>Continue</button></div>
          </aside>
        </div>`;
    }



    function providerText(value, fallback="—") {
      if(value===null||value===undefined||value==="")return fallback;
      if(typeof value==="object")return "—";
      return String(value);
    }
    function supplierTaxLines(offer) {
      const raw=Array.isArray(offer?.taxBreakdown)?offer.taxBreakdown:[];
      return raw.map(t=>{
        const label=[t.code,t.name||"Tax",t.description].filter(Boolean).join(" · ");
        const isCarrier=t.carrierImposed===true||t.carrier_imposed===true;
        return `<div class="money-line"><span>${escapeHTML(label)}${isCarrier?" (carrier imposed)":""}</span><strong>${t.amount!=null&&t.amount!==""?money(t.amount,t.currency||offer.taxCurrency||offer.totalCurrency):"Not provided by supplier"}</strong></div>`;
      }).join("");
    }
    function supplierTravelDisclosure(offer) {
      if(!offer)return "";
      const slices=Array.isArray(offer.slices)?offer.slices:[];
      const refundable=offer.conditions?.refundBeforeDeparture||offer.conditions?.refund_before_departure;
      const changeable=offer.conditions?.changeBeforeDeparture||offer.conditions?.change_before_departure;
      const displayRule=(rule,label)=>rule?`<div class="money-line"><span>${label}</span><strong>${rule.allowed===true?"Permitted":rule.allowed===false?"Not permitted":"See airline conditions"}${rule.penaltyAmount!=null||rule.penalty_amount!=null?` · ${money(rule.penaltyAmount??rule.penalty_amount,rule.penaltyCurrency||rule.penalty_currency||offer.totalCurrency)}`:""}</strong></div>`:"";
      const code=(a,b)=>providerText(a??b,"");
      return `<section class="panel" style="margin-top:10px">
        <div class="panel-head">Airline fare, tax and journey details</div>
        <div class="panel-body">
          <div class="grid grid-3" style="margin-bottom:10px">
            <div class="stat"><div class="stat-label">Base fare</div><div class="stat-value" style="font-size:16px">${offer.baseAmount!=null?money(offer.baseAmount,offer.baseCurrency||offer.totalCurrency):"Not supplied"}</div></div>
            <div class="stat"><div class="stat-label">Tax</div><div class="stat-value" style="font-size:16px">${offer.taxAmount!=null?money(offer.taxAmount,offer.taxCurrency||offer.totalCurrency):"Not supplied"}</div></div>
            <div class="stat"><div class="stat-label">CO₂ (supplier estimate)</div><div class="stat-value" style="font-size:16px">${offer.totalEmissionsKg!=null?escapeHTML(offer.totalEmissionsKg)+" kg":"Not supplied"}</div></div>
          </div>
          ${supplierTaxLines(offer)?`<details><summary>Itemized supplier taxes</summary><div class="panel-body">${supplierTaxLines(offer)}</div></details>`:""}
          ${displayRule(refundable,"Refund before departure")}${displayRule(changeable,"Change before departure")}
          ${offer.paymentRequiredBy?`<div class="money-line"><span>Supplier payment deadline</span><strong>${escapeHTML(formatDateTime(offer.paymentRequiredBy))}</strong></div>`:""}
          ${offer.priceGuaranteeExpiresAt?`<div class="money-line"><span>Price guarantee expires</span><strong>${escapeHTML(formatDateTime(offer.priceGuaranteeExpiresAt))}</strong></div>`:""}
          ${Array.isArray(offer.supportedLoyaltyProgrammes)&&offer.supportedLoyaltyProgrammes.length?`<div class="money-line"><span>Supported loyalty programs</span><strong>${offer.supportedLoyaltyProgrammes.map(x=>escapeHTML(typeof x==="string"?x:x?.name||x?.iataCode||x?.airline_iata_code||"Program")).join(", ")}</strong></div>`:""}
          ${Array.isArray(offer.privateFares)&&offer.privateFares.length?`<details><summary>Applied negotiated fare data (staff)</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">${escapeHTML(JSON.stringify(offer.privateFares,null,2))}</pre></details>`:""}
          ${Array.isArray(offer.intendedPaymentMethods)&&offer.intendedPaymentMethods.length?`<details><summary>Supplier intended payment methods (staff)</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">${escapeHTML(JSON.stringify(offer.intendedPaymentMethods,null,2))}</pre></details>`:""}
          ${slices.map((slice,i)=>`<div style="padding:8px 0;border-top:1px solid var(--line)"><strong>Journey ${i+1}: ${escapeHTML(slice.origin?.iataCode||"")} → ${escapeHTML(slice.destination?.iataCode||"")}</strong>
            ${slice.fareBrandName?`<span class="badge info">${escapeHTML(slice.fareBrandName)}</span>`:""}
            ${slice.ngsShelf!=null?`<span class="muted">· NGS ${escapeHTML(slice.ngsShelf)}</span>`:""}
            ${slice.comparisonKey?`<span class="muted">· Comparison ${escapeHTML(slice.comparisonKey)}</span>`:""}
            ${(slice.segments||[]).map(segment=>`<div class="money-line"><span>${escapeHTML(segment.marketingCarrier?.iataCode||"")}${escapeHTML(segment.marketingFlightNumber||"")} · ${escapeHTML(segment.operatingCarrier?.name||"Operating carrier unavailable")} ${segment.operatingFlightNumber?`(${escapeHTML(segment.operatingFlightNumber)})`:""}</span><strong>${escapeHTML([segment.aircraft?.name,segment.aircraft?.iataCode].filter(Boolean).join(" / ")||"Aircraft not supplied")}</strong></div>
              <div class="money-line"><span>Terminals</span><strong>${escapeHTML(code(segment.originTerminal)||"—")} → ${escapeHTML(code(segment.destinationTerminal)||"—")}</strong></div>
              ${(segment.passengers||[]).map(p=>`<div class="money-line"><span>Passenger fare ${escapeHTML(p.id||p.passengerId||"")}</span><strong>${escapeHTML([p.fareBasisCode,p.cabinClassMarketingName,p.cabinClass].filter(Boolean).join(" · ")||"Not supplied")}</strong></div>
                ${(p.baggages||[]).length?`<div class="muted">Included baggage: ${(p.baggages||[]).map(b=>escapeHTML([b.quantity,b.type,b.weight&&`${b.weight} ${b.weightUnit||""}`].filter(Boolean).join(" "))).join(", ")}</div>`:""}
                ${p.cabinAmenities?`<details><summary>Cabin amenities from supplier</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">${escapeHTML(JSON.stringify(p.cabinAmenities,null,2))}</pre></details>`:""}`).join("")}`).join("")}
            ${slice.conditions&&Object.keys(slice.conditions).length?`<details><summary>Journey conditions</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">${escapeHTML(JSON.stringify(slice.conditions,null,2))}</pre></details>`:""}
          </div>`).join("")}
        </div>
      </section>`;
    }

    function itineraryMarkup(offer) {
      return (offer.slices || []).map((slice, index) => {
        const segments = (slice.segments || []).map((segment) => `
          <div class="segment">
            <div><strong>${escapeHTML(segment.marketingCarrier?.iataCode || "")} ${escapeHTML(segment.marketingFlightNumber || "")}</strong><br><span class="muted">Operated by ${escapeHTML(segment.operatingCarrier?.name || "carrier pending")}</span></div>
            <div><span class="time">${timeOnly(segment.departingAt)}</span><br>${escapeHTML(segment.origin?.iataCode || "—")}<br><span class="muted">${formatShortDate(segment.departingAt)}</span></div>
            <div><span class="time">${timeOnly(segment.arrivingAt)}</span><br>${escapeHTML(segment.destination?.iataCode || "—")}<br><span class="muted">${formatShortDate(segment.arrivingAt)}</span></div>
            <div><strong>${escapeHTML(segment.duration || slice.duration || "—")}</strong><br><span class="muted">${escapeHTML(segment.aircraft?.name || "")}</span></div>
          </div>`).join("");
        return `<section class="slice-card">
          <div class="slice-head"><span>Slice ${index + 1}: ${escapeHTML(slice.origin?.iataCode || "—")} → ${escapeHTML(slice.destination?.iataCode || "—")}</span><span>${escapeHTML(slice.duration || "")}</span></div>
          ${segments}
        </section>`;
      }).join("");
    }


    function serviceListMarkup(services) {
      if (!services.length) return emptyState("＋", "No extra services returned", "The airline did not return bookable baggage or other services for this offer.");
      return services.map((service) => {
        const selected = state.selectedServices.has(service.id);
        return `<div class="service-row">
          <div><strong>${escapeHTML(service.label || service.type || "Service")}</strong><br><span class="muted">${escapeHTML(service.passengerName || service.passengerId || "")}${service.segmentLabel ? ` · ${escapeHTML(service.segmentLabel)}` : ""}</span></div>
          <strong>${money(service.totalAmount, service.totalCurrency)}</strong>
          <button class="${selected ? "secondary" : "primary"}" data-action="toggle-service" data-service-id="${escapeAttr(service.id)}">${selected ? "Remove" : "Add"}</button>
        </div>`;
      }).join("");
    }



    function seatMapMarkup() {
      const seats = state.seatMaps.flatMap((map) => map.seats || []);
      if (!state.seatMaps.length) return `<div class="muted">Seat maps load after a refreshed offer is selected.</div>`;
      if (!seats.length) return emptyState("▦", "No paid seat services returned", "The airline did not expose selectable seats for this offer.");
      return `<div class="seat-grid">${seats.map((seat) => {
        const service = seat.availableServices?.[0];
        const selected = service && state.selectedServices.has(service.id);
        const label = `${seat.designator || "Seat"}${service ? ` · ${money(service.totalAmount, service.totalCurrency)}` : ""}`;
        return `<button class="seat ${selected ? "selected" : ""}" data-action="toggle-seat" data-service-id="${escapeAttr(service?.id || "")}" ${service ? "" : "disabled"} title="${escapeAttr(seat.cabinName || "")}">${escapeHTML(label)}</button>`;
      }).join("")}</div>`;
    }


    function renderWorkspace() {
      const offer = state.selectedOffer;
      if (!offer) {
        return `${pageHead("Order Workspace", "Traveler details, payment, and order creation.")}
          ${emptyState("◫", "No refreshed offer", "Select and refresh a live offer before creating an order.")}`;
      }
      const passengers = offer.passengers || [];
      return `
        ${pageHead("Order Workspace", "Complete traveler details exactly as shown on travel documents.")}
        ${skandiDuffelOfferExpiredNow(offer) ? alertBox("danger", "Offer expired", "Do not collect payment. Return to search and refresh a current offer.") : ""}
        <form id="orderForm" class="workspace-layout">
          <div>
            ${passengers.map((passenger, index) => passengerForm(passenger, index)).join("")}
            <section class="panel">
              <div class="panel-head">Order type and payment</div>
              <div class="panel-body">
                <div class="grid grid-2">
                  <div class="field">
                    <label for="orderType">Order type</label>
                    <select id="orderType">
                      <option value="instant">Instant purchase</option>
                      <option value="hold" ${offer.requiresInstantPayment ? "disabled" : ""}>Hold (only when the offer permits)</option>
                    </select>
                  </div>
                  <div class="field">
                    <label for="orderRemarks">Internal reference (optional)</label>
                    <input id="orderRemarks" maxlength="100" autocomplete="off" placeholder="SKANDI booking reference">
                  </div>
                </div>
                <div id="paymentArea">
                  <div class="alert info">
                    <span>ℹ</span>
                    <div><strong>Secure payment</strong>Prepare payment to open Stripe's hosted Payment Element. Card data never enters the ALTEA workspace or SKANDI system bridge.</div>
                  </div>
                  <button type="button" class="secondary" data-action="prepare-payment" ${skandiDuffelOfferExpiredNow(offer) ? "disabled" : ""}>Prepare secure payment</button>
                  <div id="paymentStatus" class="muted" style="margin-top:8px">${state.payment?.paymentIntentId ? `Payment reference: ${escapeHTML(state.payment.paymentIntentId)}` : "No payment prepared."}</div>
                </div>
              </div>
            </section>
          </div>
          <aside class="panel sticky">
            <div class="panel-head">Order summary</div>
            <div class="panel-body">
              <div class="money-line"><span>Offer</span><strong>${money(offer.totalAmount, offer.totalCurrency)}</strong></div>
              <div class="money-line"><span>Services</span><strong>${money(selectedServiceTotal(), offer.totalCurrency)}</strong></div>
              <div class="money-line"><span>Total</span><strong class="price-total">${money(orderTotal(), offer.totalCurrency)}</strong></div>
              <div class="money-line"><span>Travelers</span><strong>${passengers.length}</strong></div>
              <div class="money-line"><span>Offer expires</span><strong>${formatDateTime(offer.expiresAt)}</strong></div>
            </div>
            <div class="panel-foot"><button class="primary" type="submit" ${skandiDuffelOfferExpiredNow(offer) ? "disabled" : ""}>Create order</button></div>
          </aside>
        </form>`;
    }


    function passengerForm(passenger, index) {
      const kind = passenger.type || (passenger.age != null ? `Age ${passenger.age}` : "Traveler");
      const identityFields = state.selectedOffer?.identityDocumentRequired ? `
        <div class="grid grid-3">
          <div class="field">
            <label>Passport number</label>
            <input data-field="passport_number" autocomplete="off" maxlength="50" required>
          </div>
          <div class="field">
            <label>Issuing country (ISO 2)</label>
            <input data-field="passport_country" autocomplete="off" maxlength="2" placeholder="US" required>
          </div>
          <div class="field">
            <label>Passport expiry</label>
            <input data-field="passport_expiry" type="date" min="${isoDate(new Date(Date.now() + 86400000))}" required>
          </div>
        </div>` : "";
      return `<section class="passenger-card" data-passenger-id="${escapeAttr(passenger.id)}">
        <div class="panel-head"><span>Traveler ${index + 1}</span><span class="badge info">${escapeHTML(kind)}</span></div>
        <div class="panel-body">
          <div class="grid grid-4">
            <div class="field">
              <label>Title</label>
              <select data-field="title" required>
                <option value="">Select</option><option>mr</option><option>ms</option><option>mrs</option><option>miss</option><option>dr</option>
              </select>
            </div>
            <div class="field">
              <label>Given name</label>
              <input data-field="given_name" autocomplete="given-name" maxlength="70" required>
            </div>
            <div class="field">
              <label>Family name</label>
              <input data-field="family_name" autocomplete="family-name" maxlength="70" required>
            </div>
            <div class="field">
              <label>Date of birth</label>
              <input data-field="born_on" type="date" max="${isoDate(new Date())}" required>
            </div>
            <div class="field">
              <label>Gender</label>
              <select data-field="gender" required><option value="">Select</option><option value="m">Male</option><option value="f">Female</option></select>
            </div>
            <div class="field">
              <label>Email</label>
              <input data-field="email" type="email" autocomplete="email" maxlength="254" required>
            </div>
            <div class="field span-2">
              <label>Phone number (E.164)</label>
              <input data-field="phone_number" type="tel" autocomplete="tel" placeholder="+12125550123" maxlength="20" required>
            </div>
          </div>
          ${identityFields}
        </div>
      </section>`;
    }


    function renderOrders() {
      return `
        ${pageHead("Bookings & Orders", "Search the SKANDI ALTEA booking ledger, create a SKANDI file, or open a live order.",
          '<button class="primary" data-action="new-local-booking">New SKANDI booking</button><button class="secondary" data-action="refresh-all">Refresh all</button>')}
        <section class="panel" style="margin-bottom:10px">
          <div class="panel-head">ALTEA booking search</div>
          <div class="toolbar">
            <input id="alteaBookingSearch" style="height:28px;min-width:300px;flex:1" placeholder="Booking reference, PNR, supplier order, passenger or route">
            <button class="primary" data-action="search-altea-bookings">Search</button>
          </div>
          <div id="alteaBookingsTable">${alteaBookingTable(state.alteaBookings)}</div>
        </section>
        <section class="panel">
          <div class="panel-head">Live orders</div>
          <div class="toolbar">
            <label class="sr-only" for="ordersFilter">Filter supplier orders</label>
            <input id="ordersFilter" style="height:28px;min-width:260px" placeholder="Filter loaded orders">
            <span class="muted">${state.orders.length} loaded</span>
          </div><div id="ordersTable">${orderTable(state.orders)}</div>
        </section>`;
    }


    function alteaBookingTable(bookings) {
      if (!bookings.length) return emptyState("▧", "No ALTEA bookings loaded", "Create a booking or search the internal booking ledger.");
      return `<table class="data-table"><thead><tr><th>SKANDI / PNR</th><th>Supplier</th><th>Route</th><th>Travel</th><th>Total</th><th>Status</th><th>Ticketing</th></tr></thead><tbody>
        ${bookings.map(b=>`<tr>
          <td><button class="link mono" data-action="open-altea-booking" data-booking-id="${escapeAttr(b.id)}">${escapeHTML(b.bookingReference || b.pnrLocator || b.id)}</button><br><small class="muted">${escapeHTML(b.supplierBookingReference || "")}</small></td>
          <td>${escapeHTML(b.supplier || "SKANDI")}<br><small class="mono muted">${escapeHTML(shortId(b.supplierOrderId || ""))}</small></td>
          <td>${escapeHTML([b.origin,b.destination].filter(Boolean).join(" → ") || "—")}</td>
          <td>${escapeHTML(b.departureDate || "—")}${b.returnDate?`<br><small>${escapeHTML(b.returnDate)}</small>`:""}</td>
          <td>${money(b.totalAmount,b.currency)}</td>
          <td><span class="badge ${statusClass(b.status)}">${escapeHTML(b.status||"unknown")}</span></td>
          <td><span class="badge ${statusClass(b.ticketingStatus)}">${escapeHTML(b.ticketingStatus||"pending")}</span></td>
        </tr>`).join("")}
      </tbody></table>`;
    }


    function orderTable(orders) {
      if (!orders.length) return emptyState(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`, "No live orders loaded", "Refresh orders or retrieve a specific order-ID.");
      return `<table class="data-table">
        <thead><tr><th>Booking reference</th><th>Order-ID</th><th>Route</th><th>Travelers</th><th>Total</th><th>Order status</th><th>Payment status</th><th>Payment deadline</th><th>Supplier actions</th><th>Created</th></tr></thead>
        <tbody>${orders.map((order) => `<tr>
          <td><button class="link mono" data-action="open-order" data-order-id="${escapeAttr(order.id)}">${escapeHTML(order.bookingReference || "Pending")}</button></td>
          <td class="mono">${escapeHTML(shortId(order.id))}</td>
          <td>${escapeHTML(order.route || "—")}</td>
          <td>${Number(order.passengerCount || 0)}</td>
          <td class="nowrap">${money(order.totalAmount, order.totalCurrency)}</td>
          <td><span class="badge ${statusClass(order.status)}">${escapeHTML(order.status || "unknown")}</span></td>
          <td>${escapeHTML(typeof order.paymentStatus==="string"?order.paymentStatus:order.paymentStatus?.status||"Not reported")}</td>
          <td class="nowrap">${order.paymentRequiredBy?formatDateTime(order.paymentRequiredBy):'<span class="muted">Not supplied</span>'}</td>
          <td>${Array.isArray(order.availableActions) && order.availableActions.length?escapeHTML(order.availableActions.join(", ")):'<span class="muted">None returned</span>'}</td>
          <td class="nowrap">${formatDateTime(order.createdAt)}</td>
        </tr>`).join("")}</tbody>
      </table>`;
    }


    function renderActions() {
      const order = state.selectedOrder;
      if (!order) {
        return `${pageHead("Changes / Refunds", "Supplier servicing is available depending on agreements.")}
          ${emptyState("↻", "No supplier order selected", "Open a booking from Bookings & Orders.")}`;
      }
      const actions = order.availableActions || [];
      const canCancel = actions.includes("cancel") || actions.includes("cancel_order");
      const canChange = actions.includes("change");
      const changeAmount = Number(state.pendingChange?.changeTotalAmount || 0);
      return `
        ${pageHead("Changes / Refunds", `Order ${order.bookingReference || order.id}`,
          '<button class="secondary" data-action="refresh-current-order">Refresh order</button>')}
        ${state.customerRefundRequired ? alertBox("warning", "Customer refund reconciliation required", "The airline has returned value to SKANDI. Reconcile the customer payment separately according to SKANDI policy.") : ""}
        <div class="workspace-layout">
          <div>
            ${orderConfirmationMarkup(order)}
            <section class="panel" style="margin-top:10px">
              <div class="panel-head"><span>Flight change / reissue</span><span class="badge ${canChange?"success":"neutral"}">${canChange?"AVAILABLE":"UNAVAILABLE"}</span></div>
              <div class="panel-body">
                ${!canChange ? alertBox("warning", "Change unavailable", "System does not currently report the change action for this airline order.") : changeSearchMarkup(order)}
                ${canChange && state.changeOffers.length ? changeOffersMarkup(state.changeOffers) : ""}
                ${state.pendingChange ? pendingChangeMarkup(state.pendingChange) : ""}
              </div>
            </section>
            <section class="panel" style="margin-top:10px">
              <div class="panel-head">Cancellation / refund quote</div>
              <div class="panel-body">
                ${!canCancel ? alertBox("warning", "Cancellation unavailable", "System does not currently report a cancel action for this order.") : ""}
                ${state.cancellation ? cancellationMarkup(state.cancellation) : '<p class="muted">Create a cancellation quote to inspect the airline refund before confirming.</p>'}
              </div>
              <div class="panel-foot">
                ${state.cancellation && (!state.cancellation.expiresAt || Date.parse(state.cancellation.expiresAt)>Date.now())
                  ? `<button class="danger-btn" data-action="confirm-cancellation">Confirm cancellation</button>`
                  : `<button class="secondary" data-action="quote-cancellation" ${canCancel ? "" : "disabled"}>${state.cancellation?"Renew expired quote":"Quote cancellation"}</button>`}
              </div>
            </section>
          </div>
          <aside class="panel sticky">
            <div class="panel-head">Supplier-authorized actions</div>
            <div class="panel-body">${actions.length
              ? actions.map((action) => `<div class="money-line"><span>${escapeHTML(humanize(action))}</span><span class="badge info">ALTEA</span></div>`).join("")
              : '<span class="muted">No servicing actions returned by the airline.</span>'}
              <div class="alert info" style="margin:10px 0 0"><span>ℹ</span><div><strong>No simulated ATC</strong>ALTEA only executes changes, cancellations and refunds when the live supplier exposes them.</div></div>
            </div>
          </aside>
        </div>`;
    }


    function changeSearchMarkup(order){
      const slices=order.slices||[];
      const first=slices[0]||{};
      return `<div class="alert info"><span>↻</span><div><strong>Live airline repricing</strong>Choose the existing flight slice to replace. System sends the request back to the original airline and returns real change offers, penalties and fare differences.</div></div>
        <div class="grid grid-4">
          <div class="field"><label>Replace slice</label><select id="changeSlice">${slices.map((slice,index)=>`<option value="${escapeAttr(slice.id||"")}">${escapeHTML(changeSliceLabel(slice,index))}</option>`).join("")}</select></div>
          <div class="field"><label>New origin</label><input id="changeOrigin" maxlength="3" value="${escapeAttr(first.origin?.iataCode||"")}"></div>
          <div class="field"><label>New destination</label><input id="changeDestination" maxlength="3" value="${escapeAttr(first.destination?.iataCode||"")}"></div>
          <div class="field"><label>New departure date</label><input id="changeDate" type="date" min="${isoDate(new Date())}" value="${escapeAttr((first.segments?.[0]?.departingAt||"").slice(0,10))}"></div>
        </div>
        <div class="grid grid-2"><div class="field"><label>Cabin</label><select id="changeCabin"><option value="economy">Economy</option><option value="premium_economy">Premium Economy</option><option value="business">Business</option><option value="first">First</option></select></div><div style="display:flex;align-items:end;padding-bottom:10px"><button class="primary" data-action="search-order-changes">Search change options</button></div></div>`;
    }


    function changeSliceLabel(slice,index){
      return `Slice ${index+1} · ${slice.origin?.iataCode||"—"} → ${slice.destination?.iataCode||"—"} · ${(slice.segments?.[0]?.departingAt||"").slice(0,10)||"date"}`;
    }


    function changeOffersMarkup(offers){
      return `<div style="margin-top:12px"><div class="strong" style="margin-bottom:6px">Live change offers</div>${offers.map(offer=>{
        const added=offer.slices?.add?.[0];
        const carriers=unique((added?.segments||[]).map(s=>s.operatingCarrier?.name).filter(Boolean));
        const route=added?`${added.origin?.iataCode||added.segments?.[0]?.origin?.iataCode||"—"} → ${added.destination?.iataCode||added.segments?.[Math.max((added.segments?.length||1)-1,0)]?.destination?.iataCode||"—"}`:"Replacement flight";
        return `<div class="offer-row"><div class="offer-summary"><div class="offer-price"><span class="muted">Change total</span><strong>${money(offer.changeTotalAmount,offer.changeTotalCurrency)}</strong><small>${offer.penaltyTotalAmount!=null?`Penalty ${money(offer.penaltyTotalAmount,offer.penaltyTotalCurrency||offer.changeTotalCurrency)}`:"Penalty not supplied"}</small></div><div class="offer-route"><div class="strong">${escapeHTML(route)}</div><div>${escapeHTML(carriers.join(", ")||"Operating carrier returned by airline")}</div><small>${formatDateTime(added?.segments?.[0]?.departingAt||"")} · expires ${formatDateTime(offer.expiresAt)}</small></div><div class="offer-action"><button class="primary" data-action="select-change-offer" data-change-offer-id="${escapeAttr(offer.id)}" ${offer.expiresAt && Date.parse(offer.expiresAt)<=Date.now()?"disabled":""}>Select change</button></div></div></div>`;
      }).join("")}</div>`;
    }


    function pendingChangeMarkup(change){
      const amount=Number(change.changeTotalAmount||0);
      const paymentReady=state.paymentPurpose==="change" && !!state.payment?.paymentIntentId && state.payment?.status==="requires_capture";
      const changeExpired=!!change.expiresAt && Date.parse(change.expiresAt)<=Date.now();
      return `<div class="panel" style="margin-top:12px;box-shadow:none"><div class="panel-head">Pending airline change · final review</div><div class="panel-body">
        ${alertBox(amount<0?"warning":"info", amount<0?"Airline refund due":"Airline change ready", amount<0?"Confirming this change returns value through the supplier flow. SKANDI must separately reconcile the customer payment.":"System requires the final current amount shown below before the flight is changed.")}
        <div class="money-line"><span>Change ID</span><strong class="mono">${escapeHTML(change.id||"")}</strong></div>
        <div class="money-line"><span>Fare difference / refund</span><strong>${money(change.changeTotalAmount,change.changeTotalCurrency)}</strong></div>
        <div class="money-line"><span>Airline penalty</span><strong>${change.penaltyTotalAmount!=null?money(change.penaltyTotalAmount,change.penaltyTotalCurrency||change.changeTotalCurrency):"Not supplied"}</strong></div>
        <div class="money-line"><span>New order total</span><strong>${change.newTotalAmount!=null?money(change.newTotalAmount,change.newTotalCurrency||change.changeTotalCurrency):"Not supplied"}</strong></div>
        <div class="money-line"><span>Price expires</span><strong>${formatDateTime(change.expiresAt)}</strong></div>
        ${changeExpired?alertBox("warning","Supplier change offer expired","Request a fresh airline change quote before authorizing payment or confirming the change."):""}
        ${amount>0 && state.paymentPurpose==="change" && state.payment?.paymentIntentId && !paymentReady?alertBox("info","Payment authorization pending","Only a Stripe PaymentIntent with requires_capture status qualifies for the supplier change confirmation."):""}
      </div><div class="panel-foot">
        ${!changeExpired && amount>0 && !paymentReady?`<button class="primary" data-action="prepare-change-payment">Authorize ${escapeHTML(money(change.changeTotalAmount,change.changeTotalCurrency))}</button>`:""}
        ${!changeExpired && (amount<=0 || paymentReady)?`<button class="${amount<0?"secondary":"primary"}" data-action="confirm-order-change">Confirm airline change</button>`:""}
      </div></div>`;
    }


    function cancellationMarkup(cancellation) {
      return `${alertBox("warning", "Review before confirmation", "Confirming this quote cancels the order. This cannot be undone from this screen.")}
        <div class="money-line"><span>Quote ID</span><strong class="mono">${escapeHTML(cancellation.id)}</strong></div>
        <div class="money-line"><span>Quoted supplier refund (not yet processed)</span><strong>${cancellation.refundAmount!=null?money(cancellation.refundAmount,cancellation.refundCurrency):"Not provided by airline"}</strong></div>
        <div class="money-line"><span>Expires</span><strong>${cancellation.expiresAt?formatDateTime(cancellation.expiresAt):"Not supplied"}</strong></div>
        ${cancellation.expiresAt && Date.parse(cancellation.expiresAt)<=Date.now()?alertBox("warning","Quote expired","Create a new quote before confirming the supplier cancellation."):""}`;
    }


    function supplierOrderDisclosure(order) {
      const actual=order||{}, cur=actual.totalCurrency||actual.baseCurrency||actual.taxCurrency||"";
      const line=(label,value)=>value===null||value===undefined||value===""?"":`<div class="money-line"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>`;
      const formatted=(label,amount,currency)=>amount===null||amount===undefined||amount===""?"":`<div class="money-line"><span>${escapeHTML(label)}</span><strong>${escapeHTML(money(amount,currency||cur||"USD"))}</strong></div>`;
      const taxes=Array.isArray(actual.taxBreakdown)?actual.taxBreakdown:[];
      const documents=Array.isArray(actual.documents)?actual.documents:[];
      const services=Array.isArray(actual.services)?actual.services:[];
      const changes=Array.isArray(actual.airlineInitiatedChanges)?actual.airlineInitiatedChanges:[];
      const payment=actual.paymentStatus;
      const paymentLabels=payment&&typeof payment==="object"?Object.entries(payment).filter(([key,value])=>["awaiting_payment","paid_at","payment_required_by","status","type"].includes(key)&&value!==null&&value!==undefined):[];
      return `<section class="panel supplier-order-disclosure" style="margin-top:10px">
        <div class="panel-head">Duffel supplier order / payment facts</div>
        <div class="panel-body">
          <div class="grid grid-3">
            <div><div class="muted">Supplier order</div><strong class="mono">${escapeHTML(actual.id||"—")}</strong></div>
            <div><div class="muted">Order type</div><strong>${escapeHTML(actual.type||"—")}</strong></div>
            <div><div class="muted">Payment status</div><strong>${escapeHTML(typeof payment==="string"?payment:(payment?.status||(payment?.awaiting_payment===true?"Awaiting payment":"Supplier status not supplied")))}</strong></div>
          </div>
          ${formatted("Base fare + booked services (before tax)",actual.baseAmount,actual.baseCurrency)}
          ${formatted("Supplier tax total",actual.taxAmount,actual.taxCurrency)}
          ${formatted("Supplier order total",actual.totalAmount,actual.totalCurrency)}
          ${line("Payment required by",actual.paymentRequiredBy?formatDateTime(actual.paymentRequiredBy):"")}
          ${line("Price guaranteed until",actual.priceGuaranteedExpiresAt?formatDateTime(actual.priceGuaranteedExpiresAt):"")}
          ${line("Void window ends",actual.voidWindowEndsAt?formatDateTime(actual.voidWindowEndsAt):"")}
          ${line("Supplier last synchronized",actual.syncedAt?formatDateTime(actual.syncedAt):"")}
          ${paymentLabels.map(([k,v])=>line(`Payment ${humanize(k)}`,typeof v==="boolean"?(v?"Yes":"No"):String(v))).join("")}
          ${taxes.length?`<details class="supplier-fact-details"><summary>Individual supplier tax lines (${taxes.length})</summary>${taxes.map(t=>`<div class="money-line"><span>${escapeHTML([t.name||t.code||"Supplier tax",t.code&&t.name?`(${t.code})`:"",t.description||"",t.carrier_imposed===true||t.carrierImposed===true?"Carrier-imposed":""].filter(Boolean).join(" · "))}</span><strong>${t.amount!=null?escapeHTML(money(t.amount,t.currency||actual.taxCurrency||cur)):"Not provided"}</strong></div>`).join("")}</details>`:""}
          ${services.length?`<details class="supplier-fact-details"><summary>Booked airline services (${services.length})</summary><table class="data-table"><thead><tr><th>Supplier ID</th><th>Type</th><th>Traveler / Segment</th><th>Quantity</th><th>Supplier amount</th></tr></thead><tbody>${services.map(v=>`<tr><td class="mono">${escapeHTML(v.id||"—")}</td><td>${escapeHTML(v.label||v.type||"—")}</td><td>${escapeHTML([...(v.passengerIds||[]),...(v.segmentIds||[])].join(" / ")||"—")}</td><td>${v.quantity!=null?escapeHTML(v.quantity):"—"}</td><td>${v.totalAmount!=null?escapeHTML(money(v.totalAmount,v.totalCurrency||cur)):"—"}</td></tr>`).join("")}</tbody></table></details>`:""}
          ${documents.length?line("Supplier document records",String(documents.length)):""}
          ${changes.length?`<details class="supplier-fact-details"><summary>Recorded airline-initiated changes (${changes.length})</summary>${changes.map(c=>`<div class="money-line"><span class="mono">${escapeHTML(c.id||"—")}</span><strong>${escapeHTML(c.action_taken||c.actionTaken||"No response recorded")}</strong></div>`).join("")}</details>`:""}
          ${Array.isArray(actual.bookingReferences)&&actual.bookingReferences.length?`<details class="supplier-fact-details"><summary>All booking references</summary><div class="mono">${actual.bookingReferences.map(b=>escapeHTML(typeof b==="string"?b:JSON.stringify(b))).join(" · ")}</div></details>`:""}
          ${Array.isArray(actual.intendedPaymentMethods)&&actual.intendedPaymentMethods.length?`<details class="supplier-fact-details"><summary>Recorded supplier payment methods</summary><pre class="supplier-fact-pre">${escapeHTML(JSON.stringify(actual.intendedPaymentMethods,null,2))}</pre></details>`:""}
          ${actual.conditions&&Object.keys(actual.conditions).length?`<details class="supplier-fact-details"><summary>Supplier refund/change conditions</summary><pre class="supplier-fact-pre">${escapeHTML(JSON.stringify(actual.conditions,null,2))}</pre></details>`:""}
          <div class="muted" style="padding-top:8px">Values shown here are returned by the supplier. They do not constitute a new payment, refund, ticket issue or servicing action. Stripe remains the customer payment authority.</div>
        </div>
      </section>`;
    }

    function orderConfirmationMarkup(order) {
      const carrierNames = unique(order.slices?.flatMap((slice) => slice.segments?.map((segment) => segment.operatingCarrier?.name).filter(Boolean)) || []);
      return `<section class="panel">
        <div class="panel-head"><span>Order confirmation</span><span class="badge ${statusClass(order.status)}">${escapeHTML(order.status || "unknown")}</span></div>
        <div class="panel-body">
          <div class="grid grid-3">
            <div><span class="muted">Booking reference</span><div class="price-total mono">${escapeHTML(order.bookingReference || "Pending")}</div></div>
            <div><span class="muted">Order ID</span><div class="strong mono" style="margin-top:6px">${escapeHTML(order.id)}</div></div>
            <div><span class="muted">Total</span><div class="price-total">${money(order.totalAmount, order.totalCurrency)}</div></div>
          </div>
          <div class="alert info" style="margin-top:10px;margin-bottom:0"><span>✈</span><div><strong>Operating carriers</strong>${escapeHTML(carrierNames.join(", ") || "Carrier disclosure pending")}</div></div>
        </div>
      </section>
      <section class="panel" style="margin-top:10px">
        <div class="panel-head">Documents</div>
        <div class="panel-body" style="padding:0">${documentTable(order.documents || [])}</div>
      </section>
      ${supplierOrderDisclosure(order)}`;
    }


    function documentTable(documents) {
      if (!documents.length) return emptyState("▧", "No documents returned", "Documents appear when the airline issues them.");
      return `<table class="data-table"><thead><tr><th>Type</th><th>Number</th><th>Status</th></tr></thead><tbody>
        ${documents.map((document) => `<tr><td>${escapeHTML(document.type || "document")}</td><td class="mono">${escapeHTML(document.uniqueIdentifier || document.id || "—")}</td><td><span class="badge ${document.uniqueIdentifier?"success":"neutral"}">${document.uniqueIdentifier?"IDENTIFIER RETURNED":"SUPPLIER RECORD"}</span></td></tr>`).join("")}
      </tbody></table>`;
    }


    function activeWorkspace() {
      return state.alteaWorkspace;
    }


    function renderBookingFile() {
      const w=activeWorkspace();
      if(!w?.booking) return `${pageHead("Booking File","Unified SKANDI booking file backed by the internal ALTEA ledger.")}${emptyState("▣","No booking selected","Open a booking from Bookings & Orders or create a new order.")}`;
      const b=w.booking;
      return `${pageHead("Booking File",`${b.bookingReference||b.pnrLocator||b.id} · ${b.supplier||"SKANDI"}`,
        '<button class="secondary" data-action="refresh-booking-file">Refresh</button>')}
        <div class="grid grid-4">
          ${statCard("Booking",b.bookingReference||b.pnrLocator||"—","SKANDI / supplier reference")}
          ${statCard("Route",[b.origin,b.destination].filter(Boolean).join(" → ")||"—",b.departureDate||"Travel date pending")}
          ${statCard("Passengers",w.passengers?.length||0,"Linked ALTEA passenger records")}
          ${statCard("Ticketing",humanize(b.ticketingStatus||"pending"),`${w.documents?.length||0} document(s) stored`)}
        </div>
        <div class="workspace-layout" style="margin-top:10px">
          <div>
            <section class="panel"><div class="panel-head">Booking summary</div><div class="panel-body">
              <div class="grid grid-3">
                <div><span class="muted">Supplier</span><div class="strong">${escapeHTML(b.supplier||"SKANDI")}</div></div>
                <div><span class="muted">Supplier order</span><div class="mono strong">${escapeHTML(b.supplierOrderId||"—")}</div></div>
                <div><span class="muted">Supplier booking reference</span><div class="mono strong">${escapeHTML(b.supplierBookingReference||"—")}</div></div>
                <div><span class="muted">Status</span><div><span class="badge ${statusClass(b.status)}">${escapeHTML(b.status||"—")}</span></div></div>
                <div><span class="muted">Payment</span><div>${escapeHTML(b.paymentStatus||"—")}</div></div>
                <div><span class="muted">Fulfillment</span><div>${escapeHTML(b.fulfillmentStatus||"—")}</div></div>
                <div><span class="muted">Customer</span><div>${escapeHTML(b.customerName||"—")}</div></div>
                <div><span class="muted">Email</span><div>${escapeHTML(b.customerEmail||"—")}</div></div>
                <div><span class="muted">Total</span><div class="strong">${money(b.totalAmount,b.currency)}</div></div>
              </div>
            </div></section>
            <section class="panel" style="margin-top:10px"><div class="panel-head">Passengers</div><div class="panel-body" style="padding:0">${passengerTable(w.passengers||[])}</div></section>
          </div>
          <aside class="panel sticky"><div class="panel-head">Continue working</div><div class="panel-body action-stack">
           <button class="primary" data-action="checkout-skandi-balance">Checkout / Settle Balance</button>
            <button class="secondary" data-view="passengers">Passengers / APIS</button>
            <button class="secondary" data-view="services">Seats & Services</button>
            <button class="secondary" data-view="ticketing">Ticketing & Documents</button>
            <button class="secondary" data-view="actions">Changes / Refunds</button>
            <button class="secondary" data-view="history">History & Audit</button>
          </div></aside>
        </div>`;
    }


    function passengerTable(passengers){
      if(!passengers.length) return '<div class="empty">No passenger records are linked to this booking yet.</div>';
      return `<table class="data-table"><thead><tr><th>Passenger</th><th>Type</th><th>APIS</th><th>Document</th><th>Seat</th><th>Airline check-in</th></tr></thead><tbody>
        ${passengers.map(p=>`<tr><td><button class="link" data-action="select-passenger" data-passenger-id="${escapeAttr(p.id)}">${escapeHTML(p.displayName||[p.firstName,p.lastName].filter(Boolean).join(" ")||p.passengerRef||"Passenger")}</button><br><small class="mono muted">${escapeHTML(p.supplierPassengerId||p.passengerRef||"")}</small></td><td>${escapeHTML(p.paxType||"ADT")}</td><td><span class="badge ${statusClass(p.apisStatus)}">${escapeHTML(p.apisStatus||"not started")}</span></td><td><span class="badge ${statusClass(p.documentStatus)}">${escapeHTML(p.documentStatus||"not checked")}</span></td><td class="mono">${escapeHTML(p.seatNumber||"—")}</td><td>${escapeHTML(p.checkinStatus||"not checked in")}</td></tr>`).join("")}
      </tbody></table>`;
    }


    function renderPassengers(){
      const w=activeWorkspace();
      if(!w?.booking) return `${pageHead("Passengers / APIS","Manage SKANDI passenger records without pretending to be the operating airline DCS.")}${emptyState("♙","No booking selected","Select a booking first.")}`;
      const passengers=w.passengers||[];
      const selected=passengers.find(p=>p.id===state.selectedPassengerId)||passengers[0]||null;
      if(selected) state.selectedPassengerId=selected.id;
      const canAddLocal=String(w.booking.supplier||"SKANDI").toUpperCase()==="SKANDI";
      return `${pageHead("Passengers / APIS",`${w.booking.bookingReference||w.booking.pnrLocator} · ${passengers.length} passenger(s)`,canAddLocal?'<button class="primary" data-action="add-local-passenger">Add passenger</button>':'')}
        <div class="alert info"><span>ℹ</span><div><strong>Agency passenger management</strong>APIS/document readiness is managed in SKANDI. Airline check-in remains controlled by the operating carrier unless an authorized DCS integration supplies that status.</div></div>
        <div class="workspace-layout"><section class="panel"><div class="panel-head">Passenger list</div><div class="panel-body" style="padding:0">${passengerTable(passengers)}</div></section>
        <aside class="panel sticky"><div class="panel-head">Selected passenger</div><div class="panel-body">${selected?passengerEditor(selected):'<span class="muted">No passenger selected.</span>'}</div></aside></div>`;
    }


    function passengerEditor(p){
      return `<form id="passengerOpsForm" data-passenger-id="${escapeAttr(p.id)}">
        <div class="grid grid-2"><div class="field"><label>First name</label><input id="paxFirst" value="${escapeAttr(p.firstName||"")}"></div><div class="field"><label>Last name</label><input id="paxLast" value="${escapeAttr(p.lastName||"")}"></div></div>
        <div class="grid grid-2"><div class="field"><label>Nationality</label><input id="paxNationality" maxlength="3" value="${escapeAttr(p.nationality||"")}"></div><div class="field"><label>Passport</label><input readonly value="${p.passportLast4?`•••• ${escapeAttr(p.passportLast4)}`:"Not stored/displayed"}"></div></div>
        <div class="field"><label>APIS status</label><select id="paxApis">${["not_started","captured","complete","needs_review"].map(v=>option(v,humanize(v),p.apisStatus)).join("")}</select></div>
        <div class="field"><label>Document status</label><select id="paxDoc">${["not_checked","pending_check","verified","needs_review","rejected"].map(v=>option(v,humanize(v),p.documentStatus)).join("")}</select></div>
        <div class="grid grid-2"><div class="field"><label>Seat</label><input id="paxSeat" maxlength="10" value="${escapeAttr(p.seatNumber||"")}"></div><div class="field"><label>Sequence</label><input id="paxSeq" maxlength="20" value="${escapeAttr(p.sequenceNumber||"")}"></div></div>
        <div class="field"><label>Airline check-in status</label><select id="paxCheckin">${["not_checked_in","carrier_managed","checked_in","boarded","no_show"].map(v=>option(v,humanize(v),p.checkinStatus)).join("")}</select></div>
        <div class="field"><label>Operational note</label><textarea id="paxNote">${escapeHTML(p.payload?.operationalNote||"")}</textarea></div>
        <button class="primary" type="submit">Save passenger</button>
      </form>`;
    }


    function renderServices(){
      const order=state.selectedOrder,w=activeWorkspace();
      const components=(w?.components||[]).filter(c=>c.status!=="REMOVED");
      return `${pageHead("Seats & Services","System controls airline seats/baggage, live hotel stays and car rentals; SKANDI Inventory Control supplies transfers, tours, activities, partner tickets, packages and local ancillaries.",
        !w?.booking?'<button class="primary" data-action="new-local-booking">New SKANDI booking</button>':'')}
        <div class="alert info"><span>ℹ</span><div><strong>One booking file</strong>Air services remain supplier-controlled. SKANDI products are attached to the same internal booking file as separate components so staff can manage the whole journey without inventing airline records.</div></div>
        ${w?.booking?`<section class="panel"><div class="panel-head"><span>Selected SKANDI booking components</span><span>${components.length} active</span></div><div class="panel-body" style="padding:0">${componentTable(components)}</div></section>`:''}
        <section class="panel" style="margin-top:10px"><div class="panel-head"><span>SKANDI Inventory Control catalog</span><span class="muted">Published · staff visible</span></div><div class="panel-body" style="padding:0">${inventoryCatalogMarkup()}</div></section>
        ${state.selectedOffer?`<section class="panel" style="margin-top:10px"><div class="panel-head">Current airline services</div><div class="panel-body" style="padding:0">${serviceListMarkup(state.selectedOffer.availableServices||[])}</div></section>
          <section class="panel" style="margin-top:10px"><div class="panel-head"><span>Live seat maps</span><button class="link" data-action="load-seat-maps">Refresh</button></div><div class="panel-body">${seatMapMarkup()}</div></section>`:''}
        ${!state.selectedOffer&&order?`<section class="panel" style="margin-top:10px"><div class="panel-head">Airline services</div><div class="panel-body"><p class="muted">The confirmed order is attached to this booking. New paid seat/baggage services are only shown when the supplier exposes a supported servicing path.</p></div></section>`:''}
        ${w?.passengers?.length?`<section class="panel" style="margin-top:10px"><div class="panel-head">Recorded passenger seating</div><div class="panel-body" style="padding:0">${passengerTable(w.passengers)}</div></section>`:''}`;
    }


    function componentTable(items){
      if(!items.length)return '<div class="empty">No SKANDI journey components selected.</div>';
      return `<table class="data-table"><thead><tr><th>Type</th><th>Service</th><th>Supplier</th><th>Qty</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>${items.map(c=>`<tr><td>${escapeHTML(humanize(c.componentType))}</td><td><strong>${escapeHTML(c.title)}</strong><br><small class="mono muted">${escapeHTML(c.supplierReference||"")}</small></td><td>${escapeHTML(c.supplier||"SKANDI")}</td><td>${c.quantity}</td><td>${money(c.totalAmount,c.currency)}</td><td><select class="component-status-select" data-component-id="${escapeAttr(c.id)}"><option ${c.status==="SELECTED"?"selected":""}>SELECTED</option><option ${c.status==="REQUESTED"?"selected":""}>REQUESTED</option><option ${c.status==="CONFIRMED"?"selected":""}>CONFIRMED</option><option ${c.status==="CANCELLED"?"selected":""}>CANCELLED</option></select></td><td><button class="link" data-action="remove-component" data-component-id="${escapeAttr(c.id)}">Remove</button></td></tr>`).join("")}</tbody></table>`;
    }


    function inventoryCatalogMarkup(){
      const items=state.inventory||[];
      if(!items.length)return '<div class="empty">No published SKANDI hotel, transfer, tour, car, package or ancillary inventory is currently available.</div>';
      return `<table class="data-table"><thead><tr><th>Type</th><th>Product</th><th>Destination</th><th>Price</th><th></th></tr></thead><tbody>${items.map(i=>`<tr><td>${escapeHTML(humanize(i.entityType))}</td><td><strong>${escapeHTML(i.name)}</strong><br><small class="mono muted">${escapeHTML(i.publicId||i.code||"")}</small></td><td>${escapeHTML(i.city||i.category||"—")}</td><td>${i.publicPrice?money(i.publicPrice,i.currency):'<span class="muted">Price / request rules apply</span>'}</td><td><button class="primary" data-action="add-inventory-component" data-entity-id="${escapeAttr(i.id)}" ${activeWorkspace()?.booking?"":"disabled"}>Add to booking</button></td></tr>`).join("")}</tbody></table>`;
    }


    function renderTicketing(){
      const w=activeWorkspace(),order=state.selectedOrder;
      if(!w?.booking&&!order) return `${pageHead("Ticketing & Documents","Supplier-issued air documents and SKANDI-controlled booking documents in one place.")}${emptyState("▥","No booking selected","Open a booking or supplier order first.")}`;
      const supplierDocs=order?.documents||[];
      const internalDocs=w?.documents||[];
      return `${pageHead("Ticketing & Documents",w?.booking?.bookingReference||order?.bookingReference||"Current order")}
        <div class="alert info"><span>ℹ</span><div><strong>Document authority</strong>Electronic ticket/airline document identifiers shown here come from the supplier. ALTEA does not generate fake airline ticket or EMD numbers.</div></div>
        <div class="grid grid-2">
          <section class="panel"><div class="panel-head">Airline documents</div><div class="panel-body" style="padding:0">${documentTable(supplierDocs)}</div></section>
          <section class="panel"><div class="panel-head">ALTEA document register</div><div class="panel-body" style="padding:0">${internalDocumentTable(internalDocs)}</div></section>
        </div>
        <section class="panel" style="margin-top:10px"><div class="panel-head">SKANDI controlled forms</div><div class="panel-body"><p class="muted">Booking-linked forms, waivers and customer document packets continue through DocuNet and appear in the Orders view when assigned.</p><button class="secondary" data-view="orders">Open booking documents</button></div></section>`;
    }


    function internalDocumentTable(docs){
      if(!docs.length) return '<div class="empty">No internal booking documents recorded.</div>';
      return `<table class="data-table"><thead><tr><th>Provider</th><th>Type</th><th>Number</th><th>Status</th><th></th></tr></thead><tbody>${docs.map(d=>`<tr><td>${escapeHTML(d.provider||"SKANDI")}</td><td>${escapeHTML(d.documentType||"DOCUMENT")}</td><td class="mono">${escapeHTML(d.documentNumber||"—")}</td><td><span class="badge ${statusClass(d.status)}">${escapeHTML(d.status||"—")}</span></td><td><button class="link" data-action="view-generated-document" data-document-id="${escapeAttr(d.id)}">View / Print</button></td></tr>`).join("")}</tbody></table>`;
    }


    function renderBaggageBoarding(){
      const w=activeWorkspace();
      return `${pageHead("Baggage & Boarding","SKANDI operational assistance around airline-controlled baggage and boarding processes.")}
        <div class="alert warning"><span>⚠</span><div><strong>Operating carrier controls DCS</strong>SKANDI can record baggage/seat/document readiness and produce internal assistance paperwork. A real airline bag tag or boarding pass must come from an authorized airline/DCS source.</div></div>
        ${w?.passengers?.length?`<section class="panel"><div class="panel-head">Passenger operational status</div><div class="panel-body" style="padding:0">${passengerTable(w.passengers)}</div></section>`:emptyState("▰","No booking selected","Open a booking to work with its passenger operational status.")}
        <div class="grid grid-2" style="margin-top:10px"><section class="panel"><div class="panel-head">Baggage</div><div class="panel-body"><p class="muted">Paid baggage is selected from available services during offer/booking. Recorded service IDs stay linked to the ALTEA booking file.</p><button class="secondary" data-view="services">Open seats & services</button></div></section><section class="panel"><div class="panel-head">Boarding documents</div><div class="panel-body"><p class="muted">Use airline-issued boarding documents where supplied. SKANDI sample layouts are not valid travel documents and are not automatically issued from this workspace.</p></div></section></div>`;
    }


    function renderRequirements(){
      return `${pageHead("Travel Requirements","Internal SKANDI requirements guidance. Live Timatic is not connected to this workspace.")}
        <div class="alert warning"><span>⚠</span><div><strong>Not a live Timatic decision</strong>The uploaded Timatic interface was a training simulator. These records are SKANDI content only and must not be represented as a live IATA/Timatic boarding decision.</div></div>
        <div class="grid grid-2">${(state.requirements||[]).map(r=>`<section class="panel"><div class="panel-head"><span>${escapeHTML(r.title||"Travel requirement")}</span><span class="badge info">${escapeHTML(r.category||"GUIDANCE")}</span></div><div class="panel-body">${escapeHTML(r.body||"").replace(/\n/g,"<br>")}</div></section>`).join("")||emptyState("✓","No active requirements","No active SKANDI travel requirement records are currently published internally.")}</div>`;
    }


    function renderHistory(){
      const w=activeWorkspace(),items=w?.history||[];
      return `${pageHead("History & Audit",w?.booking?`Booking ${w.booking.bookingReference||w.booking.id}`:"Select a booking to view its operational history.")}
        ${w?.booking?`<section class="panel" style="margin-bottom:10px"><div class="panel-head">Add agent note</div><form id="historyNoteForm" class="panel-body"><div class="field"><label>Operational note</label><textarea id="historyNote" required></textarea></div><button class="primary" type="submit">Add history note</button></form></section>`:''}
        <section class="panel"><div class="panel-head">Booking history</div><div class="panel-body" style="padding:0">${historyTable(items)}</div></section>`;
    }


    function historyTable(items){
      if(!items.length) return '<div class="empty">No history entries for the selected booking.</div>';
      return `<table class="data-table"><thead><tr><th>Time</th><th>Event</th><th>Supplier</th><th>Command</th><th>Detail</th></tr></thead><tbody>${items.map(h=>`<tr><td class="nowrap">${formatDateTime(h.createdAt)}</td><td><strong>${escapeHTML(h.eventType||"EVENT")}</strong></td><td>${escapeHTML(h.supplier||"—")}</td><td class="mono">${escapeHTML(h.command||"—")}</td><td>${escapeHTML(h.payload?.note||h.payload?.orderStatus||h.payload?.status||"")}</td></tr>`).join("")}</tbody></table>`;
    }


    function renderProfiles() {
      return `
        ${pageHead("Traveler Profiles", "Traveler details are deliberately not stored in the browser.")}
        <div class="alert info">
          <span>ℹ</span>
          <div><strong>Production privacy control</strong>Names, birth dates, contact details, and identity data are collected only inside the active order workspace and sent through the authenticated system bridge. Enable reusable profiles only through the controlled customer-profile service.</div>
        </div>
        <section class="panel">
          <div class="panel-head">Profile status</div>
          <div class="empty"><div class="big">♙</div><strong>No browser-stored profiles</strong><br><span>Reusable profiles stay disabled until a consented server-side profile store is connected.</span></div>
        </section>`;
    }


    function renderReports() {
      const currencies = {};
      state.orders.forEach((order) => {
        const currency = order.totalCurrency || "UNKNOWN";
        currencies[currency] = (currencies[currency] || 0) + Number(order.totalAmount || 0);
      });
      return `
        ${pageHead("Sales Reports", "A live summary of the currently loaded order result set.",
          '<button class="secondary" data-action="export-orders">Export loaded CSV</button>')}
        <div class="grid grid-3">
          ${Object.entries(currencies).map(([currency, amount]) => statCard(`Gross ${currency}`, money(amount, currency), "Loaded orders")).join("") || statCard("Gross sales", "—", "Load orders to calculate")}
          ${statCard("Order count", state.orders.length, "Loaded result set")}
          ${statCard("Passengers", state.orders.reduce((sum, order) => sum + Number(order.passengerCount || 0), 0), "Across loaded orders")}
        </div>
        <section class="panel" style="margin-top:10px"><div class="panel-head">Order detail</div><div class="panel-body" style="padding:0">${orderTable(state.orders)}</div></section>`;
    }


    function renderPreferences() {
      return `
        ${pageHead("Preferences", "Interface preferences apply to this open session only.")}
        <div class="grid grid-2">
          <section class="panel">
            <div class="panel-head">Display</div>
            <div class="panel-body">
              <label class="check" style="margin-bottom:10px"><input id="prefCompact" type="checkbox" ${state.preferences.compact ? "checked" : ""}> Use compact data tables</label>
              <div class="field"><label for="prefCurrency">Default currency</label><input id="prefCurrency" maxlength="3" value="${escapeAttr(state.preferences.currency)}"></div>
              <button class="primary" data-action="save-preferences">Save for this session</button>
            </div>
          </section>
          <section class="panel">
            <div class="panel-head">Integration</div>
            <div class="panel-body">
              <div class="money-line"><span>Air provider</span><strong>Flights</strong></div>
              <div class="money-line"><span>Internal ledger</span><strong>ALTEA operational ledger</strong></div>
              <div class="money-line"><span>Environment</span><strong>${escapeHTML(state.environment || "Pending handshake")}</strong></div>
              <div class="money-line"><span>Authentication</span><strong>RIA INTRA staff session</strong></div>
              <div class="money-line"><span>Browser credentials</span><strong>None</strong></div>
            </div>
          </section>
        </div>`;
    }


    function bindViewEvents() {
      $$("[data-view]", main).forEach((button) => button.addEventListener("click", () => navigate(button.dataset.view)));
      $$("[data-action]", main).forEach(bindAction);


      const searchForm = $("#flightSearchForm");
      if (searchForm) {
        searchForm.addEventListener("submit", submitSearch);
        $("#tripType").addEventListener("change", updateTripType);
        ["#origin", "#destination", "#currency"].forEach((selector) => {
          $(selector).addEventListener("input", (event) => { event.target.value = event.target.value.toUpperCase().replace(/[^A-Z]/g, ""); });
        });
        updateTripType();
      }


      const orderForm = $("#orderForm");
      if (orderForm) {
        orderForm.addEventListener("submit", submitOrder);
        $("#orderType").addEventListener("change", updatePaymentVisibility);
        updatePaymentVisibility();
      }


      const ordersFilter = $("#ordersFilter");
      if (ordersFilter) {
        ordersFilter.addEventListener("input", () => {
          const query = ordersFilter.value.trim().toLowerCase();
          const filtered = state.orders.filter((order) => JSON.stringify(order).toLowerCase().includes(query));
          $("#ordersTable").innerHTML = orderTable(filtered);
          $$("[data-action]", $("#ordersTable")).forEach(bindAction);
        });
      }
      const passengerOpsForm = $("#passengerOpsForm");
      if (passengerOpsForm) passengerOpsForm.addEventListener("submit", savePassengerOps);
      const historyNoteForm = $("#historyNoteForm");
      if (historyNoteForm) historyNoteForm.addEventListener("submit", addHistoryNote);
      $$(".doc-status-select", main).forEach(select=>select.addEventListener("change",()=>post("ALTEA_UPDATE_DOCUMENT_STATUS",{documentId:select.dataset.documentId,status:select.value})));
      $$(".component-status-select", main).forEach(select=>select.addEventListener("change",()=>post("ALTEA_UPDATE_COMPONENT",{componentId:select.dataset.componentId,status:select.value})));
      const changeSlice=$("#changeSlice");
      if(changeSlice)changeSlice.addEventListener("change",()=>fillChangeRouteFromSlice(changeSlice.value));
    }


    function bindAction(element) {
      element.addEventListener("click", async () => {
        const action = element.dataset.action;
        if (action === "refresh-orders") loadOrders();
        if (action === "refresh-all") { loadOrders(); post("ALTEA_UNIFIED_BOOTSTRAP",{}, {busy:false}); }
        if (action === "search-altea-bookings") post("ALTEA_SEARCH_BOOKINGS",{query:$("#alteaBookingSearch")?.value||"",limit:100});
        if (action === "open-altea-booking") post("ALTEA_GET_BOOKING",{bookingId:element.dataset.bookingId});
        if (action === "refresh-booking-file" && state.alteaWorkspace?.booking?.id) post("ALTEA_GET_BOOKING",{bookingId:state.alteaWorkspace.booking.id});
        if (action === "select-passenger") { state.selectedPassengerId=element.dataset.passengerId||""; navigate("passengers"); }
        
        // Ensure element exists before calling focus
        if (action === "focus-order-search") {
          const searchBox = $("#globalOrderSearch");
          if (searchBox) searchBox.focus();
        }
        
        if (action === "swap-airports") swapAirports();
        if (action === "select-offer") selectOffer(element.dataset.offerId);
        if (action === "refresh-selected-offer") refreshSelectedOffer();
        if (action === "load-seat-maps") loadSeatMaps();
        if (action === "toggle-service") toggleService(element.dataset.serviceId);
        if (action === "toggle-seat") toggleSeat(element.dataset.serviceId);
        if (action === "prepare-payment") preparePayment();
        if (action === "open-order") retrieveOrder(element.dataset.orderId);
        if (action === "refresh-current-order") retrieveOrder(state.selectedOrder?.id);
        if (action === "quote-cancellation") quoteCancellation();
        if (action === "confirm-cancellation") confirmCancellation();
        if (action === "new-local-booking") openLocalBookingModal();
        if (action === "add-local-passenger") openLocalPassengerModal();
        if (action === "add-inventory-component") addInventoryComponent(element.dataset.entityId);
        if (action === "remove-component") post("ALTEA_UPDATE_COMPONENT",{componentId:element.dataset.componentId,status:"REMOVED"});
        if (action === "search-order-changes") searchOrderChanges();
        if (action === "select-change-offer") selectChangeOffer(element.dataset.changeOfferId);
        if (action === "prepare-change-payment") prepareChangePayment();
        if (action === "confirm-order-change") confirmOrderChange();
        if (action === "export-orders") exportOrders();
        if (action === "save-preferences") savePreferences();
        if (action === "view-generated-document") post("ALTEA_GET_DOCUMENT",{bookingId:booking()?.id||state.alteaWorkspace?.booking?.id||"",documentId:element.dataset.documentId});
        if (action === "open-advanced-ticketing") masterNavigate("/riaintra/success-factors/altea/ticketing");
        if (action === "open-timatic-desk") masterNavigate("/riaintra/success-factors/altea/timatic");
      });
    }


    function savePassengerOps(event){
      event.preventDefault();
      const form=event.currentTarget;
      post("ALTEA_UPDATE_PASSENGER",{
        passengerId:form.dataset.passengerId,
        patch:{
          firstName:$("#paxFirst")?.value||"",lastName:$("#paxLast")?.value||"",nationality:$("#paxNationality")?.value||"",
          apisStatus:$("#paxApis")?.value||"",documentStatus:$("#paxDoc")?.value||"",checkinStatus:$("#paxCheckin")?.value||"",
          seatNumber:$("#paxSeat")?.value||"",sequenceNumber:$("#paxSeq")?.value||"",operationalNote:$("#paxNote")?.value||""
        }
      });
    }
    function addHistoryNote(event){
      event.preventDefault();
      if(!state.alteaWorkspace?.booking?.id)return;
      post("ALTEA_ADD_HISTORY_NOTE",{bookingId:state.alteaWorkspace.booking.id,note:$("#historyNote")?.value||"",eventType:"AGENT_NOTE"});
    }


    function openLocalPassengerModal(){
      const booking=activeWorkspace()?.booking;
      if(!booking?.id)return toast("Booking file required","Create or open a SKANDI booking file first.","warning");
      if(String(booking.supplier||"").toUpperCase()!=="SKANDI")return toast("Supplier-controlled passenger list","Passengers cannot be added internally to a confirmed airline order.","warning");
      openModal("Add passenger",`
        <div class="grid grid-2"><div class="field"><label>First name</label><input id="newPaxFirst" maxlength="100" required></div><div class="field"><label>Last name</label><input id="newPaxLast" maxlength="100" required></div></div>
        <div class="grid grid-3"><div class="field"><label>Type</label><select id="newPaxType"><option>ADT</option><option>CHD</option><option>INF</option><option>YTH</option><option>SEN</option></select></div><div class="field"><label>Date of birth</label><input id="newPaxDob" type="date"></div><div class="field"><label>Nationality</label><input id="newPaxNationality" maxlength="3"></div></div>
        <div class="grid grid-2"><div class="field"><label>Email</label><input id="newPaxEmail" type="email" maxlength="254"></div><div class="field"><label>Phone</label><input id="newPaxPhone" maxlength="30"></div></div>
        <div class="field"><label>Gender</label><select id="newPaxGender"><option value="">Not specified</option><option value="M">Male</option><option value="F">Female</option><option value="X">X / unspecified</option></select></div>
        <div class="alert info"><span>ℹ</span><div><strong>Travel documents</strong>This form deliberately does not put passport numbers into general booking JSON. Secure travel-document capture remains a separate protected workflow.</div></div>`,[
          {label:"Cancel",className:"secondary",close:true},
          {label:"Add passenger",className:"primary",onClick:()=>{
            const firstName=$("#newPaxFirst")?.value.trim()||"",lastName=$("#newPaxLast")?.value.trim()||"";
            if(!firstName||!lastName)return toast("Name required","Enter the passenger first and last name.","warning");
            closeModal();
            post("ALTEA_CREATE_PASSENGER",{bookingId:booking.id,firstName,lastName,paxType:$("#newPaxType")?.value||"ADT",dateOfBirth:$("#newPaxDob")?.value||"",nationality:$("#newPaxNationality")?.value||"",email:$("#newPaxEmail")?.value||"",phone:$("#newPaxPhone")?.value||"",gender:$("#newPaxGender")?.value||""});
          }}
        ]);
    }


    function openLocalBookingModal(){
      openModal("New SKANDI booking file",`
        <div class="alert info"><span>▣</span><div><strong>Local / package booking</strong>Create the internal booking file first, then add published SKANDI inventory components. Supplier confirmations remain separate until actually confirmed.</div></div>
        <div class="field"><label>Customer name</label><input id="localCustomerName" maxlength="200"></div>
        <div class="field"><label>Customer email</label><input id="localCustomerEmail" type="email" maxlength="254"></div>
        <div class="grid grid-2"><div class="field"><label>Currency</label><input id="localCurrency" maxlength="3" value="${escapeAttr(state.preferences.currency||"USD")}"></div><div></div></div>
        <div class="field"><label>Internal notes</label><textarea id="localBookingNotes"></textarea></div>`,[
          {label:"Cancel",className:"secondary",close:true},
          {label:"Create booking file",className:"primary",onClick:()=>{
            const currency=String($("#localCurrency")?.value||"USD").toUpperCase();
            if(!/^[A-Z]{3}$/.test(currency))return toast("Invalid currency","Use a three-letter currency code.","warning");
            closeModal();
            post("ALTEA_CREATE_LOCAL_BOOKING",{customerName:$("#localCustomerName")?.value||"",customerEmail:$("#localCustomerEmail")?.value||"",currency,notes:$("#localBookingNotes")?.value||""});
          }}
        ]);
    }


    function addInventoryComponent(entityId){
      const bookingId=activeWorkspace()?.booking?.id;
      if(!bookingId)return toast("Booking file required","Create or open a SKANDI booking file first.","warning");
      const item=(state.inventory||[]).find(x=>String(x.id)===String(entityId));
      const allDated=item?.dated||[];
      const dated=allDated.filter(d=>!d.stopSale&&!d.blackout&&Number(d.available??0)>0&&["OPEN","AVAILABLE"].includes(String(d.status||"OPEN").toUpperCase()));
      if(allDated.length&&!dated.length)return toast("No sellable dated inventory","Every dated line for this product is closed, sold out, blackout or stop-sale.","warning");
      if(!allDated.length){
        post("ALTEA_ADD_INVENTORY_COMPONENT",{bookingId,entityId,quantity:1});
        return;
      }
      openModal("Add SKANDI inventory",`
        <div class="alert info"><span>▣</span><div><strong>${escapeHTML(item?.name||"Inventory product")}</strong>Select the dated inventory line so ALTEA reserves the same capacity controlled by Inventory Control.</div></div>
        <div class="field"><label>Service / variant</label><select id="invDatedLine">${dated.map(d=>`<option value="${escapeAttr(d.id||d.datedInventoryId)}">${escapeHTML(d.serviceDate||d.service_date||"")} · ${escapeHTML(d.variantName||d.variant_name||d.variantCode||d.variant_code||"Standard")} · ${escapeHTML(String(d.available??0))} available${Number(d.publicPrice||d.public_price||d.adult_price||0)>0?` · ${money(Number(d.publicPrice||d.public_price||d.adult_price||0),d.currency||item?.currency||booking()?.currency)}`:""}</option>`).join("")}</select></div>
        <div class="field"><label>Quantity</label><input id="invQty" type="number" min="1" max="99" value="1"></div>`,[
          {label:"Cancel",className:"secondary",close:true},
          {label:"Reserve & add",className:"primary",onClick:()=>{const datedInventoryId=$("#invDatedLine")?.value||"";const quantity=Math.max(1,Math.min(99,Number($("#invQty")?.value||1)));closeModal();post("ALTEA_ADD_INVENTORY_COMPONENT",{bookingId,entityId,datedInventoryId,quantity});}}
        ]);
    }


    function fillChangeRouteFromSlice(sliceId){
      const slice=state.selectedOrder?.slices?.find(s=>s.id===sliceId);
      if(!slice)return;
      if($("#changeOrigin"))$("#changeOrigin").value=slice.origin?.iataCode||"";
      if($("#changeDestination"))$("#changeDestination").value=slice.destination?.iataCode||"";
      if($("#changeDate"))$("#changeDate").value=(slice.segments?.[0]?.departingAt||"").slice(0,10);
    }


    function searchOrderChanges(){
      const order=state.selectedOrder;
      if(!order?.id)return;
      const removeSliceId=$("#changeSlice")?.value||"";
      const origin=iata($("#changeOrigin")?.value||"");
      const destination=iata($("#changeDestination")?.value||"");
      const departureDate=$("#changeDate")?.value||"";
      const cabinClass=$("#changeCabin")?.value||"economy";
      if(!removeSliceId||!origin||!destination||!departureDate)return toast("Change details required","Complete the replacement route and date.","warning");
      if(state.servicingReconciliation?.orderId===order.id)return toast("Supplier reconciliation required","Verify the previous supplier servicing outcome before submitting another change.","warning");
      state.changeOffers=[];state.pendingChange=null;
      if(state.paymentPurpose==="change")invalidatePayment();
      const requestId=post("DUFFEL_SEARCH_ORDER_CHANGES",{orderId:order.id,removeSliceId,addSlice:{origin,destination,departureDate,cabinClass}});
      if(requestId)state.servicingRequests.changeSearch={requestId,orderId:order.id};
    }


    function selectChangeOffer(id){
      if(!id)return;
      const selected=state.changeOffers.find(o=>o.id===id);
      if(!selected)return toast("Unknown change offer","Search again to retrieve current supplier offers.","warning");
      if(selected.expiresAt && Date.parse(selected.expiresAt)<=Date.now())return toast("Change offer expired","Search again for a current supplier offer.","warning");
      if(state.servicingReconciliation?.orderId===state.selectedOrder?.id)return toast("Supplier reconciliation required","Reconcile the earlier supplier change before creating another.","warning");
      state.pendingChange=null;
      if(state.paymentPurpose==="change")invalidatePayment();
      const requestId=post("DUFFEL_CREATE_ORDER_CHANGE",{orderChangeOfferId:id});
      if(requestId)state.servicingRequests.changeCreate={requestId,orderId:state.selectedOrder?.id,offerId:id};
    }


    function prepareChangePayment(){
      if(!state.pendingChange?.id)return;
      if(state.payment?.paymentIntentId||state.servicingRequests.changePayment)return toast("Payment session active","Reconcile or complete the existing change payment before creating another authorization.","warning");
      state.paymentPurpose="change";
      const requestId=post("DUFFEL_PREPARE_CHANGE_PAYMENT",{orderChangeId:state.pendingChange.id});
      if(requestId)state.servicingRequests.changePayment={requestId,orderId:state.selectedOrder?.id,changeId:state.pendingChange.id};
    }


    function confirmOrderChange(){
      const change=state.pendingChange;
      if(!change?.id)return;
      if(state.servicingReconciliation?.orderId===state.selectedOrder?.id)return toast("Supplier reconciliation required","Check the airline change and Stripe capture status before another submission.","warning");
      if(change.orderId && change.orderId!==state.selectedOrder?.id)return toast("Order mismatch","This change belongs to another supplier order.","danger");
      const amount=Number(change.changeTotalAmount||0);
      if(change.expiresAt && Date.parse(change.expiresAt)<=Date.now())return toast("Change quote expired","Search for a fresh supplier change offer before confirming.","warning");
      const paymentIntentId=amount>0 && state.paymentPurpose==="change"?state.payment?.paymentIntentId:null;
      if(amount>0 && (!paymentIntentId||state.payment?.status!=="requires_capture"))return toast("Authorization required","Complete secure payment authorization; the payment must be in requires_capture status.","warning");
      openModal("Confirm airline change",`${alertBox("warning","Final supplier action","This updates the live airline booking. Review the final fare difference, penalty and routing before confirming.")}<div class="money-line"><span>Change amount</span><strong>${money(change.changeTotalAmount,change.changeTotalCurrency)}</strong></div><div class="money-line"><span>Penalty</span><strong>${change.penaltyTotalAmount!=null?money(change.penaltyTotalAmount,change.penaltyTotalCurrency||change.changeTotalCurrency):"Not supplied"}</strong></div>`,[
        {label:"Back",className:"secondary",close:true},
        {label:"Confirm change",className:"primary",onClick:()=>{if(change.expiresAt && Date.parse(change.expiresAt)<=Date.now())return toast("Change quote expired","Search for a fresh supplier change offer.","warning");if(amount>0 && (state.payment?.paymentIntentId!==paymentIntentId || state.payment?.status!=="requires_capture"))return toast("Authorization required","The payment authorization is not ready or has changed.","warning");closeModal();const requestId=post("DUFFEL_CONFIRM_ORDER_CHANGE",{orderChangeId:change.id,paymentIntentId});if(requestId)state.servicingRequests.changeConfirm={requestId,orderId:state.selectedOrder?.id,changeId:change.id};}}
      ]);
    }


    function submitSearch(event) {
      event.preventDefault();
      if (paymentIsCommitted() || paymentSessionStarted()) {
        return toast("Payment session active", "Create or reconcile the pending booking and payment before starting another search.", "warning");
      }
      const tripType = $("#tripType").value;
      if(tripType==="multi_search"){
        const lines=String($("#multiSearchInput")?.value||"").split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
        if(!lines.length||lines.length>8)return toast("Multi-search routes required","Enter 1–8 separate origin/destination/date lines.","warning");
        const planned=[];
        for(const line of lines){
          const match=line.toUpperCase().match(/^([A-Z]{3})\s+([A-Z]{3})\s+(\d{4}-\d{2}-\d{2})$/);
          if(!match||match[1]===match[2]||match[3]<isoDate(new Date()))return toast("Invalid multi-search route",`Use ORIGIN DESTINATION YYYY-MM-DD with valid future dates: ${line.slice(0,60)}`,"warning");
          planned.push({origin:match[1],destination:match[2],departureDate:match[3]});
        }
        const childAges=parseAges($("#childAges").value,2,17,"Child");
        const infantAges=parseAges($("#infantAges").value,0,1,"Infant");
        if(childAges===null||infantAges===null)return;
        const adults=Number($("#adults").value);
        if(adults+childAges.length+infantAges.length>9||infantAges.length>adults)return toast("Invalid passenger combination","Maximum 9 travelers; no more infants than adults.","warning");
        const passengers=[...Array.from({length:adults},()=>({type:"adult"})),...childAges.map(age=>({age})),...infantAges.map(age=>({age}))];
        const timeFilters=readOfferTimeFilters(tripType);
        if(timeFilters===null)return;
        const cabinClass=$("#cabinClass").value,maxConnections=Number($("#maxConnections").value),supplierTimeout=state.preferences.supplierTimeout;
        state.multiSearchQueue=planned.map(route=>({slices:[route],passengers,cabinClass,maxConnections,supplierTimeout}));
        state.multiSearchCompleted=0;state.multiSearchFailed=0;state.multiSearchPendingId="";state.searchPendingId="";state.multiSearchActive=true;
        state.search={tripType,multiSearchInput:$("#multiSearchInput").value,adults,childAges,infantAges,cabinClass,maxConnections,timeFilters};
        state.offers=[];state.selectedOffer=null;state.seatMaps=[];state.selectedServices.clear();state.payment=null;
        state.multiSearchPendingId=post("DUFFEL_SEARCH_OFFERS",state.multiSearchQueue.shift());
        return;
      }
      state.multiSearchActive=false;state.multiSearchQueue=[];state.multiSearchCompleted=0;state.multiSearchFailed=0;state.multiSearchPendingId="";state.searchPendingId="";
      const origin = iata($("#origin").value);
      const destination = iata($("#destination").value);
      const departureDate = $("#departureDate").value;
      const returnDate = $("#returnDate").value;
      const childAges = parseAges($("#childAges").value, 2, 17, "Child");
      const infantAges = parseAges($("#infantAges").value, 0, 1, "Infant");
      const adults = Number($("#adults").value);
      const currency = $("#currency").value.toUpperCase();
      const timeFilters=readOfferTimeFilters(tripType);
      if(timeFilters===null)return;


      if (!origin || !destination) return toast("Invalid airport", "Use valid three-letter IATA airport codes.", "warning");
      if (origin === destination) return toast("Invalid route", "Origin and destination must be different.", "warning");
      if (!departureDate || departureDate < isoDate(new Date())) return toast("Invalid departure date", "Choose today or a future date.", "warning");
      if (tripType === "round_trip" && (!returnDate || returnDate < departureDate)) return toast("Invalid return date", "Return must be on or after departure.", "warning");
      if (childAges === null || infantAges === null) return;
      if (adults + childAges.length + infantAges.length > 9) return toast("Too many travelers", "System support up to nine travelers.", "warning");
      if (infantAges.length > adults) return toast("Infant assignment required", "Use no more lap infants than adults.", "warning");
      if (!/^[A-Z]{3}$/.test(currency)) return toast("Invalid currency", "Use a three-letter ISO currency code.", "warning");


      state.preferences.currency = currency;
      state.search = {
        tripType, origin, destination, departureDate, returnDate, adults, childAges, infantAges,
        cabinClass: $("#cabinClass").value,
        maxConnections: Number($("#maxConnections").value),
        timeFilters
      };
      state.offers = [];
      state.selectedOffer = null;
      state.seatMaps = [];
      state.selectedServices.clear();
      state.payment = null;


      const slices = [{ origin, destination, departureDate }];
      if (tripType === "round_trip") slices.push({ origin: destination, destination: origin, departureDate: returnDate });
      const passengers = [
        ...Array.from({ length: adults }, () => ({ type: "adult" })),
        ...childAges.map((age) => ({ age })),
        ...infantAges.map((age) => ({ age }))
      ];


      state.searchPendingId=post("DUFFEL_SEARCH_OFFERS", {
        slices,
        passengers,
        cabinClass: state.search.cabinClass,
        maxConnections: state.search.maxConnections,
        supplierTimeout: state.preferences.supplierTimeout
      });
    }


    function updateTripType() {
      const mode=$("#tripType")?.value;
      const oneWay=mode==="one_way",multi=mode==="multi_search";
      $("#returnDateField")?.classList.toggle("hidden",oneWay||multi);
      $("#multiSearchField")?.classList.toggle("hidden",!multi);
      $("#returnTimeFilters")?.classList.toggle("hidden",mode!=="round_trip");
      ["#origin","#destination","#departureDate"].forEach(id=>{const control=$(id);if(control){control.required=!multi;control.closest(".field")?.classList.toggle("hidden",multi)}});
      const swap=$("[data-action=swap-airports]");if(swap)swap.classList.toggle("hidden",multi);
      if($("#returnDate"))$("#returnDate").required=!(oneWay||multi);
    }


    function swapAirports() {
      const origin = $("#origin");
      const destination = $("#destination");
      [origin.value, destination.value] = [destination.value, origin.value];
    }


    function selectOffer(offerId) {
      if (state.multiSearchActive || state.searchPendingId) {
        return toast("Search in progress", "Complete the current supplier search before choosing a fare.", "warning");
      }
      const candidate = (state.offers || []).find(offer => offer?.id === offerId);
      if (candidate && skandiDuffelOfferExpiredNow(candidate)) {
        return toast("Offer expired", "Search again for a current airline offer.", "warning");
      }
      if (paymentSessionStarted() || paymentIsCommitted()) {
        return toast("Payment session active", "Reconcile the current payment and booking before choosing another fare.", "warning");
      }
      state.offerRefreshOfferId=offerId;
      state.offerRefreshRequestId=post("DUFFEL_REFRESH_OFFER", { offerId });
    }


    function refreshSelectedOffer() {
      if (!state.selectedOffer?.id) return;
      if (paymentIsCommitted() || paymentSessionStarted()) {
        return toast("Payment session active", "Create or reconcile the pending booking before changing the offer.", "warning");
      }
      state.payment = null;
      destroyStripe();
      state.offerRefreshOfferId=state.selectedOffer.id;
      state.offerRefreshRequestId=post("DUFFEL_REFRESH_OFFER", { offerId: state.selectedOffer.id });
    }


    function loadSeatMaps() {
      if (state.activeView !== "services" || !state.selectedOffer?.id) return;
      state.seatMapOfferId=state.selectedOffer.id;
      state.seatMapRequestId=post("DUFFEL_GET_SEAT_MAPS", { offerId: state.selectedOffer.id });
    }


    function toggleService(serviceId) {
      if (paymentIsCommitted() || paymentSessionStarted()) {
        return toast("Payment session active", "Create or reconcile the pending booking before changing services.", "warning");
      }
      const service = state.selectedOffer?.availableServices?.find((item) => item.id === serviceId);
      if (!service) return;
      if (state.selectedServices.has(serviceId)) state.selectedServices.delete(serviceId);
      else state.selectedServices.set(serviceId, { ...service, quantity: 1 });
      invalidatePayment();
      render();
    }


    function toggleSeat(serviceId) {
      if (paymentIsCommitted() || paymentSessionStarted()) {
        return toast("Payment session active", "Create or reconcile the pending booking before changing seats.", "warning");
      }
      if (!serviceId) return;
      const services = state.seatMaps.flatMap((map) => map.seats || []).flatMap((seat) => seat.availableServices || []);
      const service = services.find((item) => item.id === serviceId);
      if (!service) return;


      for (const [id, selected] of state.selectedServices) {
        if (selected.type === "seat" && selected.passengerId === service.passengerId && selected.segmentId === service.segmentId) {
          state.selectedServices.delete(id);
        }
      }
      if (!state.selectedServices.has(serviceId)) state.selectedServices.set(serviceId, { ...service, quantity: 1 });
      invalidatePayment();
      render();
    }


    async function preparePayment() {
      if (!state.selectedOffer || skandiDuffelOfferExpiredNow(state.selectedOffer))
        return toast("Offer expired", "Refresh the offer before collecting payment.", "warning");
      const orderType = $("#orderType")?.value || "instant";
      if (orderType === "hold") return toast("Payment not required", "A hold order is created without payment or paid services.", "info");
      const passengerError = validatePassengerForms(false);
      if (passengerError) return toast("Traveler details incomplete", passengerError, "warning");
      requestOrderPaymentPreparation();
    }


    async function mountStripePayment(payment) {
      if (!globalThis.Stripe) {
        return toast("Payment unavailable", "Stripe's secure payment library could not load.", "danger");
      }
      destroyStripe();
      state.payment = payment;
      state.stripe = Stripe(payment.publishableKey);
      state.stripeElements = state.stripe.elements({ clientSecret: payment.clientSecret });
      state.stripePaymentElement = state.stripeElements.create("payment", { layout: "tabs" });


      openModal("Secure payment", `
        <div class="alert info"><span>🔒</span><div><strong>Stripe secure payment</strong>SKANDI does not receive or store raw card details.</div></div>
        <div class="money-line"><span>Amount</span><strong class="price-total">${money(payment.amount, payment.currency)}</strong></div>
        <div id="stripePaymentElement" class="payment-shell" style="margin-top:10px"></div>
        <div id="stripePaymentError" class="alert danger hidden" style="margin-top:10px"></div>
      `, [
        { label: "Cancel", className: "secondary", close: true },
        { label: "Confirm payment", className: "primary", onClick: confirmStripePayment }
      ], { size: "lg", onMount: () => state.stripePaymentElement.mount("#stripePaymentElement") });
    }


    async function confirmStripePayment() {
      const button = $("[data-modal-index='1']");
      if (button) button.disabled = true;
      const result = await state.stripe.confirmPayment({
        elements: state.stripeElements,
        redirect: "if_required"
      });
      if (result.error) {
        const errorBox = $("#stripePaymentError");
        errorBox.textContent = result.error.message || "Payment could not be confirmed.";
        errorBox.classList.remove("hidden");
        if (button) button.disabled = false;
        return;
      }
      state.payment.status = result.paymentIntent?.status || "processing";
      closeModal();
      const status = $("#paymentStatus");
      if (status) status.textContent = `Payment ${state.payment.status}: ${state.payment.paymentIntentId}`;
      toast("Payment submitted", state.paymentPurpose==="change"?`Status: ${state.payment.status}. Return to Changes / Refunds to confirm the airline change.`:`Status: ${state.payment.status}. The secure booking service will verify it before booking.`, "success");
      if(state.paymentPurpose==="change" && state.activeView==="actions")render();
    }


    function submitOrder(event) {
      event.preventDefault();
      if (!state.selectedOffer || skandiDuffelOfferExpiredNow(state.selectedOffer)) return toast("Offer unavailable", "Refresh or select a current offer.", "warning");
      const error = validatePassengerForms(true);
      if (error) return toast("Traveler details incomplete", error, "warning");


      const orderType = $("#orderType").value;
      if (orderType === "hold" && state.selectedServices.size) {
        return toast("Services unavailable on hold", "Remove paid seats and baggage before creating a hold order.", "warning");
      }
      if (orderType === "instant" && !state.payment?.paymentIntentId) {
        return toast("Payment required", "Prepare and confirm secure payment before creating the order.", "warning");
      }


      const passengers = $$(".passenger-card").map((card) => ({
        id: card.dataset.passengerId,
        title: value(card, "title"),
        givenName: value(card, "given_name"),
        familyName: value(card, "family_name"),
        bornOn: value(card, "born_on"),
        gender: value(card, "gender"),
        email: value(card, "email"),
        phoneNumber: value(card, "phone_number"),
        identityDocuments: value(card, "passport_number") ? [{
          type: "passport",
          uniqueIdentifier: value(card, "passport_number"),
          issuingCountryCode: value(card, "passport_country").toUpperCase(),
          expiresOn: value(card, "passport_expiry")
        }] : []
      }));


      openModal("Confirm order creation", `
        ${alertBox("warning", "Final booking action", orderType === "instant"
          ? "The secure booking service will verify payment, refresh the offer again, and create the airline order."
          : "This creates a hold order without payment. The airline's payment deadline will apply.")}
        <div class="money-line"><span>Order type</span><strong>${escapeHTML(orderType)}</strong></div>
        <div class="money-line"><span>Travelers</span><strong>${passengers.length}</strong></div>
        <div class="money-line"><span>Total</span><strong>${money(orderTotal(), state.selectedOffer.totalCurrency)}</strong></div>
      `, [
        { label: "Back", className: "secondary", close: true },
        { label: "Create order", className: "primary", onClick: () => {
          if (skandiDuffelOfferExpiredNow(state.selectedOffer))
            return toast("Offer expired", "Refresh the offer before creating the order.", "warning");
          closeModal();
          post("DUFFEL_CREATE_ORDER", {
            offerId: state.selectedOffer.id,
            orderType,
            passengers,
            services: orderType === "instant" ? selectedServicePayload() : [],
            paymentIntentId: orderType === "instant" ? state.payment.paymentIntentId : null,
            internalReference: $("#orderRemarks").value.trim()
          });
        }}
      ]);
    }


    function validatePassengerForms(showNative) {
      const cards = $$(".passenger-card");
      if (!cards.length) return "No traveler records were returned for this offer.";
      for (let index = 0; index < cards.length; index += 1) {
        const card = cards[index];
        const required = $$("[required]", card);
        const invalid = required.find((input) => !input.checkValidity());
        if (invalid) {
          if (showNative) invalid.reportValidity();
          return `Complete ${invalid.closest(".field")?.querySelector("label")?.textContent || "the required field"} for traveler ${index + 1}.`;
        }
        const phone = value(card, "phone_number");
        if (!/^\+[1-9]\d{7,14}$/.test(phone)) return `Use an E.164 phone number for traveler ${index + 1}, for example +12125550123.`;
      }
      return "";
    }


    function value(card, field) {
      return card.querySelector(`[data-field="${field}"]`)?.value.trim() || "";
    }


    function updatePaymentVisibility() {
      const hold = $("#orderType")?.value === "hold";
      $("#paymentArea")?.classList.toggle("hidden", hold);
    }


    function loadOrders() {
      post("DUFFEL_LIST_ORDERS", { limit: 50 });
    }


    function retrieveOrder(orderIdOrReference) {
      const query = String(orderIdOrReference || "").trim();
      if (!query) return toast("Order reference required", "Enter order ID or booking reference.", "warning");
      post("DUFFEL_GET_ORDER", { orderIdOrReference: query });
    }


    function quoteCancellation() {
      const orderId=state.selectedOrder?.id;
      if(!orderId)return;
      if(state.servicingReconciliation?.orderId===orderId)return toast("Supplier reconciliation required","Check the outstanding supplier cancellation outcome before trying again.","warning");
      state.cancellation=null;
      state.cancellationQuoteOrderId="";
      const requestId=post("DUFFEL_CREATE_CANCELLATION", { orderId });
      if(requestId)state.servicingRequests.cancellationQuote={requestId,orderId};
    }


    function confirmCancellation() {
      if (!state.cancellation?.id) return;
      const orderId=state.selectedOrder?.id||"";
      if(!orderId||state.cancellationQuoteOrderId!==orderId||state.cancellation.orderId&&state.cancellation.orderId!==orderId)return toast("Order mismatch","Get a cancellation quote for the currently selected supplier order.","warning");
      if(state.servicingReconciliation?.orderId===orderId)return toast("Supplier reconciliation required","Review the previous cancellation outcome with the airline before resubmitting.","warning");
      if (state.cancellation.expiresAt && Date.parse(state.cancellation.expiresAt)<=Date.now())return toast("Cancellation quote expired","Create a fresh cancellation quote before confirming.","warning");
      openModal("Confirm cancellation", `
        ${alertBox("danger", "This action is irreversible", `The booking order will be cancelled. Quoted airline refund: ${money(state.cancellation.refundAmount, state.cancellation.refundCurrency)}.`)}
        <label class="check"><input id="cancelAck" type="checkbox"> I reviewed the refund and want to cancel this order.</label>
      `, [
        { label: "Back", className: "secondary", close: true },
        { label: "Cancel order", className: "danger-btn", onClick: () => {
          if (!$("#cancelAck").checked) return toast("Confirmation required", "Select the confirmation checkbox.", "warning");
          if(state.cancellation?.expiresAt && Date.parse(state.cancellation.expiresAt)<=Date.now())return toast("Cancellation quote expired","Create a fresh cancellation quote.","warning");
          if(!state.selectedOrder?.id||state.selectedOrder.id!==orderId||state.cancellationQuoteOrderId!==orderId)return toast("Order changed","The selected order has changed. Create a fresh cancellation quote.","warning");
          const cancellationId=state.cancellation.id;
          closeModal();
          const requestId=post("DUFFEL_CONFIRM_CANCELLATION", { cancellationId });
          if(requestId)state.servicingRequests.cancellationConfirm={requestId,orderId,cancellationId};
        }}
      ]);
    }


    function savePreferences() {
      const currency = $("#prefCurrency").value.toUpperCase();
      if (!/^[A-Z]{3}$/.test(currency)) return toast("Invalid currency", "Use a three-letter ISO currency code.", "warning");
      state.preferences.compact = $("#prefCompact").checked;
      state.preferences.currency = currency;
      render();
      toast("Preferences saved", "Preferences apply to this open browser session.", "success");
    }


    function exportOrders() {
      if (!state.orders.length) return toast("Nothing to export", "Load orders first.", "warning");
      const columns = ["bookingReference", "id", "route", "passengerCount", "totalAmount", "totalCurrency", "status", "createdAt"];
      const rows = [columns, ...state.orders.map((order) => columns.map((column) => order[column] ?? ""))];
      const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `skandi-duffel-orders-${isoDate(new Date())}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }


    function handleParentMessage(event) {
      if (event.source !== window.parent) return;
      const message = event.data || {};
      if (message.source !== PARENT_SOURCE) return;
      state.bridgeConnected = true;
      if (message.type !== "DUFFEL_PROGRESS") settle(message.requestId);
      const payload = message.payload || {};


      // Wix page code sends this after attaching html.onMessage().
      // Re-send the child startup events so iframe/page-code load order cannot lose the handshake.
      if (message.type === "DUFFEL_PARENT_READY") {
        // Parent message validated: bridgeConnected updated above; Duffel not yet ready.
        if (state.activeView === "dashboard") render();
        post("DUFFEL_APP_READY", { version: "R-006.3-unified", retry: true }, { busy: false });
        post("ALTEA_UNIFIED_BOOTSTRAP", { version: "R-006.3-unified", retry: true }, { busy: false });
        post("INVENTORY_SEARCH_SELLABLE", { query: "" }, { busy: false });
        post("ALTEA_ENTERPRISE_MODULE_READY", {
          version: "R-006.3-unified",
          capabilities: ["master_booking","skandi_club","package_charter","documents_vouchers","travel_requirements_adapter","transfer_departure_control","manifests"]
        }, { busy: false });
        return;
      }
      if (message.type === "DUFFEL_ORDER_CREATED" || message.type === "DUFFEL_ORDER_RESULT") {
        const created = message.type === "DUFFEL_ORDER_CREATED";
        if (created && (!state.orderCreateRequestId || message.requestId !== state.orderCreateRequestId)) return;
        if (!created) {
          // A supplier order fetch is authoritative only for its own request.
          // Do not let older lookups reselect the wrong PNR/order.
          if (!state.orderLookupRequestId || message.requestId !== state.orderLookupRequestId) return;
          const expectedReference = state.orderLookupReference;
          state.orderLookupRequestId = "";
          state.orderLookupReference = "";
          if (/^ord_[A-Za-z0-9_]+$/.test(expectedReference) && payload.order?.id !== expectedReference) {
            toast("Supplier order mismatch", "Duffel returned a different order ID from the one requested. The current PNR was not changed.", "danger");
            return;
          }
        }
        if (!payload.order?.id) {
          toast("Supplier order unavailable", "The supplier did not return a valid order. Verify order status before attempting another booking.", "danger");
          if (created) { state.orderCreateRequestId = ""; state.orderCreateOfferId = ""; }
          return;
        }
        if (created) {
          state._verifiedOrderCreationRequestId = message.requestId;
          state.orderCreateRequestId = "";
          state.orderCreateOfferId = "";
        }
        state.selectedOrder = payload.order;
        state.cancellation = null;
        state.customerRefundRequired = false;
        upsertOrder(payload.order);
        if (payload.alteaWorkspace?.booking) {
          state.alteaWorkspace = payload.alteaWorkspace;
          syncFlightDataToBooking(state.alteaWorkspace.booking, payload.order);
          state.selectedPassengerId = state.alteaWorkspace.passengers?.[0]?.id || "";
          upsertAlteaBooking(state.alteaWorkspace.booking);
        }
        if (created) {
          invalidatePayment();
          closeModal();
          toast("Order created", `Booking reference ${payload.order.bookingReference || payload.order.id}.`, "success");
        }
        navigate(payload.alteaWorkspace ? "booking" : "actions");
        return;
      }

      if (message.type === "ALTEA_BOOKING_RESULT") {
        state.alteaWorkspace = payload.workspace || null;
        state.selectedPassengerId = state.alteaWorkspace?.passengers?.[0]?.id || "";
        
        // If order context exists, enrich booking file
        if (state.alteaWorkspace?.booking && state.selectedOrder) {
          syncFlightDataToBooking(state.alteaWorkspace.booking, state.selectedOrder);
        }
        
        if (state.alteaWorkspace?.booking) upsertAlteaBooking(state.alteaWorkspace.booking);
        navigate("booking");
        return;
      }

      if (message.type === "DUFFEL_BOOTSTRAP_RESULT") {
        state.bridgeConnected = true;state.connected = true;
        state.environment = payload.environment || "Duffel";
        state.preferences.currency = payload.defaultCurrency || state.preferences.currency;
        // Duffel readiness was established by the successful bootstrap response.
        if (Array.isArray(payload.orders)) state.orders = payload.orders;
        render();
        return;
      }
      if (message.type === "DUFFEL_OFFERS_RESULT") {
        if (state.multiSearchActive) {
          if (!state.multiSearchPendingId || message.requestId !== state.multiSearchPendingId) return;
          state.multiSearchPendingId="";
          const index=new Map((state.offers||[]).map(offer=>[offer.id,offer]));
          (payload.offers||[]).forEach(offer=>{if(offer?.id)index.set(offer.id,offer)});
          state.offers=Array.from(index.values());
          state.multiSearchCompleted+=1;
          navigate("search");
          if(state.multiSearchQueue.length){
            const next=state.multiSearchQueue.shift();
            state.multiSearchPendingId=post("DUFFEL_SEARCH_OFFERS",next);
          }else{
            state.multiSearchActive=false;
            toast("Multi-search completed",`${state.multiSearchCompleted} succeeded, ${state.multiSearchFailed} failed; ${state.offers.length} distinct supplier offers returned.`,state.multiSearchFailed?"warning":"success");
            render();
          }
        }else{
          if (!state.searchPendingId || message.requestId !== state.searchPendingId) return;
          state.searchPendingId="";
          state.offers = payload.offers || [];
          navigate("search");
          toast("Live offers loaded", `${state.offers.length} offer${state.offers.length === 1 ? "" : "s"} returned.`, "success");
        }
        return;
      }
      if (message.type === "DUFFEL_OFFER_RESULT") {
        if (!state.offerRefreshRequestId || message.requestId !== state.offerRefreshRequestId || !payload.offer?.id || payload.offer.id !== state.offerRefreshOfferId) return;
        state.offerRefreshRequestId="";
        state.offerRefreshOfferId="";
        state.seatMapRequestId="";
        state.seatMapOfferId="";
        state.selectedOffer = payload.offer;
        state.selectedServices.clear();
        state.seatMaps = [];
        invalidatePayment();
        navigate("offer");
        return;
      }
      if (message.type === "DUFFEL_SEAT_MAPS_RESULT") {
        if (!state.seatMapRequestId || message.requestId !== state.seatMapRequestId || state.seatMapOfferId !== state.selectedOffer?.id) return;
        state.seatMapRequestId="";
        state.seatMapOfferId="";
        state.seatMaps = payload.seatMaps || [];
        if (state.activeView === "services") render();
        return;
      }
      if (message.type === "DUFFEL_PAYMENT_RESULT") {
        if (!state.paymentPrepareRequestId || message.requestId !== state.paymentPrepareRequestId) return;
        const matchingOffer = state.paymentPrepareOfferId && state.paymentPrepareOfferId === state.selectedOffer?.id;
        state.paymentPrepareRequestId = "";
        state.paymentPrepareOfferId = "";
        if (!matchingOffer || !payload.payment?.paymentIntentId || !payload.payment?.clientSecret || !payload.payment?.publishableKey) {
          toast("Payment preparation unavailable", "The returned payment is incomplete or does not belong to the selected offer. No payment was presented.", "danger");
          return;
        }
        state.paymentPurpose="order";
        mountStripePayment(payload.payment);
        return;
      }
      if (message.type === "DUFFEL_ORDER_CREATED") {
        state.selectedOrder = payload.order;
        state.cancellation = null;
        state.customerRefundRequired = false;
        state.payment = null;
        state.paymentPurpose = null;
        destroyStripe();
        upsertOrder(payload.order);
        if(payload.alteaWorkspace){ state.alteaWorkspace=payload.alteaWorkspace; state.selectedPassengerId=payload.alteaWorkspace.passengers?.[0]?.id||""; upsertAlteaBooking(payload.alteaWorkspace.booking); }
        navigate(payload.alteaWorkspace?"booking":"actions");
        toast("Order created", `Booking reference ${payload.order.bookingReference || payload.order.id}.`, "success");
        return;
      }
      if (message.type === "DUFFEL_ORDERS_RESULT") {
        state.orders = payload.orders || [];
        if (state.activeView === "dashboard" || state.activeView === "orders" || state.activeView === "reports") render();
        toast("Orders refreshed", `${state.orders.length} live order${state.orders.length === 1 ? "" : "s"} loaded.`, "success");
        return;
      }
      if (message.type === "DUFFEL_ORDER_RESULT") {
        state.selectedOrder = payload.order;
        state.cancellation = null;
        state.customerRefundRequired = false;
        upsertOrder(payload.order);
        if(payload.alteaWorkspace){ state.alteaWorkspace=payload.alteaWorkspace; state.selectedPassengerId=payload.alteaWorkspace.passengers?.[0]?.id||""; upsertAlteaBooking(payload.alteaWorkspace.booking); }
        navigate(payload.alteaWorkspace?"booking":"actions");
        return;
      }
      if (message.type === "DUFFEL_CANCELLATION_QUOTED") {
        const expected=state.servicingRequests.cancellationQuote;
        if(!expected||message.requestId!==expected.requestId||state.selectedOrder?.id!==expected.orderId)return;
        state.servicingRequests.cancellationQuote=null;
        if(!payload.cancellation?.id||payload.cancellation.orderId!==expected.orderId){
          toast("Cancellation quote unavailable","Duffel did not return a valid quote for this order.","danger");return;
        }
        state.cancellation=payload.cancellation;
        state.cancellationQuoteOrderId=expected.orderId;
        render();
        return;
      }
      if (message.type === "DUFFEL_CANCELLATION_CONFIRMED") {
        const expected=state.servicingRequests.cancellationConfirm;
        if(!expected||message.requestId!==expected.requestId)return;
        state.servicingRequests.cancellationConfirm=null;
        state.cancellation=null;
        state.cancellationQuoteOrderId="";
        const matching=state.selectedOrder?.id===expected.orderId;
        const validOrder=payload.order?.id===expected.orderId && payload.order?.status==="cancelled";
        const validCancellation=payload.cancellation?.id===expected.cancellationId && payload.cancellation?.orderId===expected.orderId;
        if(payload.reconciliationRequired===true||!validOrder||!validCancellation){
          state.servicingReconciliation={orderId:expected.orderId,action:"cancellation",providerRequestId:payload.requestId||null,correlationId:payload.correlationId||null};
          toast("Cancellation requires reconciliation","Supplier cancellation is not verified. Check the Duffel order and customer payment/refund status; do not send another cancellation request.","warning");
          render();return;
        }
        state.servicingReconciliation=null;
        if(matching){state.selectedOrder=payload.order;state.customerRefundRequired=Boolean(payload.customerRefundRequired);}
        upsertOrder(payload.order);
        if(matching&&payload.alteaWorkspace){state.alteaWorkspace=payload.alteaWorkspace;upsertAlteaBooking(payload.alteaWorkspace.booking);}
        render();
        toast("Order cancelled",payload.customerRefundRequired?"Cancellation confirmed by Duffel. Customer refund reconciliation is required.":"Duffel confirmed this order as cancelled.",payload.customerRefundRequired?"warning":"success");
        return;
      }
      if (message.type === "DUFFEL_ORDER_CHANGE_OFFERS") {
        const expected=state.servicingRequests.changeSearch;
        if(!expected||message.requestId!==expected.requestId||state.selectedOrder?.id!==expected.orderId||payload.orderId&&payload.orderId!==expected.orderId)return;
        state.servicingRequests.changeSearch=null;
        state.changeRequestId=payload.changeRequestId||"";
        state.changeOffers=payload.offers||[];
        state.pendingChange=null;
        if(state.paymentPurpose==="change")invalidatePayment();
        navigate("actions");
        toast("Change options loaded",`${state.changeOffers.length} airline change option${state.changeOffers.length===1?"":"s"} returned.`,state.changeOffers.length?"success":"warning");
        return;
      }
      if (message.type === "DUFFEL_ORDER_CHANGE_PENDING") {
        const expected=state.servicingRequests.changeCreate;
        if(!expected||message.requestId!==expected.requestId||state.selectedOrder?.id!==expected.orderId)return;
        state.servicingRequests.changeCreate=null;
        if(payload.reconciliationRequired===true||!payload.change?.id||payload.change.orderId!==expected.orderId){
          state.servicingReconciliation={orderId:expected.orderId,action:"create_change",providerRequestId:payload.requestId||null,correlationId:payload.correlationId||null};
          toast("Airline change requires reconciliation","The pending change was not verified. Check Duffel before creating another change or payment authorization.","warning");render();return;
        }
        state.pendingChange=payload.change;
        state.changeOffers=[];
        if(state.paymentPurpose==="change")invalidatePayment();
        navigate("actions");
        return;
      }
      if (message.type === "DUFFEL_CHANGE_PAYMENT_RESULT") {
        const expected=state.servicingRequests.changePayment;
        if(!expected||message.requestId!==expected.requestId||state.selectedOrder?.id!==expected.orderId||state.pendingChange?.id!==expected.changeId)return;
        state.servicingRequests.changePayment=null;
        if(payload.change?.id&&payload.change.id!==expected.changeId)return toast("Change payment mismatch","Supplier returned an authorization for a different airline change.","danger");
        if(payload.paymentRequired!==false&&(!payload.payment?.paymentIntentId||!payload.payment?.clientSecret||!payload.payment?.publishableKey)){
          toast("Payment details unavailable","The supplier change payment response was incomplete. Reconcile before retrying.","warning");return;
        }
        if(payload.change)state.pendingChange=payload.change;
        if(payload.payment){state.paymentPurpose="change";mountStripePayment(payload.payment);}else{render();}
        return;
      }
      if (message.type === "DUFFEL_ORDER_CHANGE_CONFIRMED") {
        const expected=state.servicingRequests.changeConfirm;
        if(!expected||message.requestId!==expected.requestId)return;
        state.servicingRequests.changeConfirm=null;
        const validOrder=payload.order?.id===expected.orderId;
        const validChange=payload.change?.id===expected.changeId&&payload.change?.orderId===expected.orderId;
        if(payload.reconciliationRequired===true||payload.customerPaymentCaptureRequired===true||!validOrder||!validChange){
          state.servicingReconciliation={orderId:expected.orderId,action:"confirm_change",providerRequestId:payload.requestId||null,correlationId:payload.correlationId||null};
          toast("Airline change requires reconciliation","Supplier confirmation or Stripe capture is not verified. Reconcile the order and payment before retrying the change.","warning");
          render();return;
        }
        state.servicingReconciliation=null;
        state.changeOffers=[];state.pendingChange=null;state.changeRequestId="";
        if(state.paymentPurpose==="change")invalidatePayment();
        if(state.selectedOrder?.id===expected.orderId){
          state.selectedOrder=payload.order;
          state.customerRefundRequired=Boolean(payload.customerRefundRequired);
          if(payload.alteaWorkspace){state.alteaWorkspace=payload.alteaWorkspace;upsertAlteaBooking(payload.alteaWorkspace.booking);}
        }
        upsertOrder(payload.order);
        navigate("actions");
        toast("Airline change confirmed",payload.customerRefundRequired?`Customer refund reconciliation required: ${money(payload.customerRefundAmount,payload.customerRefundCurrency)}.`:"Duffel confirmed this airline change.",payload.customerRefundRequired?"warning":"success");
        return;
      }
      if (message.type === "ALTEA_UNIFIED_BOOTSTRAP_RESULT") {
        state.bridgeConnected = true;
        state.connected = true;
        state.alteaBookings=payload.bookings||[];
        state.inventory=payload.inventory||[];
        state.requirements=payload.requirements||[];
        if(["dashboard","orders","requirements","services"].includes(state.activeView))render();
        return;
      }
      if (message.type === "INVENTORY_SEARCH_RESULT") {
        state.inventory = payload.items || [];
        if (["services","packagebuilder","dashboard"].includes(state.activeView)) render();
        return;
      }
      if (message.type === "ALTEA_BOOKINGS_RESULT") {
        state.alteaBookings=payload.bookings||[];
        if(state.activeView==="orders")render();
        return;
      }
      if (message.type === "ALTEA_BOOKING_RESULT") {
        state.alteaWorkspace=payload.workspace||null;
        state.selectedPassengerId=state.alteaWorkspace?.passengers?.[0]?.id||"";
        if(state.alteaWorkspace?.booking)upsertAlteaBooking(state.alteaWorkspace.booking);
        navigate("booking");
        return;
      }
      if (message.type === "ALTEA_LOCAL_BOOKING_CREATED") {
        state.alteaWorkspace=payload.workspace||null;
        if(payload.workspace?.booking)upsertAlteaBooking(payload.workspace.booking);
        navigate("services");
        toast("SKANDI booking created",`Booking ${payload.workspace?.booking?.bookingReference||"file"} is ready for journey components.`,"success");
        return;
      }
      if (["ALTEA_PASSENGER_UPDATED","ALTEA_PASSENGER_CREATED","ALTEA_HISTORY_UPDATED","ALTEA_DOCUMENT_UPDATED","ALTEA_COMPONENT_UPDATED"].includes(message.type)) {
        if(payload.workspace){state.alteaWorkspace=payload.workspace;if(payload.workspace.booking)upsertAlteaBooking(payload.workspace.booking);}
        render();
        toast("ALTEA updated","The internal booking file was updated.","success");
        return;
      }
      if (message.type === "ALTEA_DOCUMENT_RESULT") {
        const documentRecord=payload.document||null;
        if(documentRecord?.htmlSnapshot){
          const printWindow=window.open("","_blank","noopener,noreferrer");
          if(printWindow){
            printWindow.document.open();
            printWindow.document.write(documentRecord.htmlSnapshot);
            printWindow.document.close();
          }else{
            toast("Document blocked","Allow pop-ups to view or print this generated document.","warning");
          }
        }else{
          toast("Document unavailable","No generated HTML is stored for this document.","warning");
        }
        return;
      }
      if (message.type === "ALTEA_ERROR") {
        toast("ALTEA action failed",payload.message||"The internal booking action could not be completed.","danger");
        return;
      }
      if (message.type === "DUFFEL_PROGRESS") {
        if (payload.message) toast("Processing", payload.message, "info");
        return;
      }
      if (message.type === "DUFFEL_ERROR") {
        const action=String(payload.action||"").toUpperCase();
        const servicingErrors={DUFFEL_CREATE_CANCELLATION:"cancellationQuote",DUFFEL_CONFIRM_CANCELLATION:"cancellationConfirm",DUFFEL_SEARCH_ORDER_CHANGES:"changeSearch",DUFFEL_CREATE_ORDER_CHANGE:"changeCreate",DUFFEL_PREPARE_CHANGE_PAYMENT:"changePayment",DUFFEL_CONFIRM_ORDER_CHANGE:"changeConfirm"};
        const serviceKey=servicingErrors[action];
        if(serviceKey){
          const expected=state.servicingRequests[serviceKey];
          if(!expected||message.requestId!==expected.requestId)return;
          state.servicingRequests[serviceKey]=null;
          if(serviceKey==="cancellationQuote"){state.cancellation=null;state.cancellationQuoteOrderId="";}
          if(serviceKey==="changePayment"&&state.paymentPurpose==="change"&&!state.payment?.paymentIntentId)state.paymentPurpose=null;
          if(serviceKey==="cancellationConfirm"||serviceKey==="changeConfirm"||serviceKey==="changeCreate"){
            state.servicingReconciliation={orderId:expected.orderId,action:serviceKey,code:payload.code||"DUFFEL_ERROR"};
            toast("Supplier servicing requires reconciliation","The supplier action was not verified. Check the airline order and payment state before submitting another action.","warning");
            render();return;
          }
        }
        if (String(payload.action || "").toUpperCase() === "DUFFEL_GET_ORDER") {
          if (!state.orderLookupRequestId || message.requestId !== state.orderLookupRequestId) return;
          state.orderLookupRequestId = "";
          state.orderLookupReference = "";
        }
        if (String(payload.action || "").toUpperCase() === "DUFFEL_CREATE_ORDER") {
          if (!state.orderCreateRequestId || message.requestId !== state.orderCreateRequestId) return;
          state.orderCreateRequestId = "";
          state.orderCreateOfferId = "";
          toast("Booking requires reconciliation", "The supplier did not confirm order creation. Check the supplier orders and payment status before retrying; an interrupted response does not prove that booking failed.", "warning");
          return;
        }
        if (String(payload.action||"").toUpperCase()==="DUFFEL_PREPARE_PAYMENT") {
          if (!state.paymentPrepareRequestId || message.requestId !== state.paymentPrepareRequestId) return;
          state.paymentPrepareRequestId = "";
          state.paymentPrepareOfferId = "";
        }
        if (String(payload.action||"").toUpperCase()==="DUFFEL_REFRESH_OFFER") {
          if (message.requestId !== state.offerRefreshRequestId) return;
          state.offerRefreshRequestId="";
          state.offerRefreshOfferId="";
        }
        if (String(payload.action||"").toUpperCase()==="DUFFEL_GET_SEAT_MAPS") {
          if (message.requestId !== state.seatMapRequestId) return;
          state.seatMapRequestId="";
          state.seatMapOfferId="";
        }
        if (!state.multiSearchActive && String(payload.action || "").toUpperCase() === "DUFFEL_SEARCH_OFFERS" && (!state.searchPendingId || message.requestId !== state.searchPendingId)) return;
        if (!state.multiSearchActive && state.searchPendingId && message.requestId === state.searchPendingId) {
          state.searchPendingId="";
        }
        if(state.multiSearchActive && state.multiSearchPendingId && message.requestId === state.multiSearchPendingId){
          state.multiSearchPendingId="";
          state.multiSearchFailed+=1;
          const authExpired=String(payload.code||"").toUpperCase()==="AUTH_REQUIRED";
          if(authExpired){
            state.multiSearchActive=false;
            state.multiSearchQueue=[];
          }else if(state.multiSearchQueue.length){
            state.multiSearchPendingId=post("DUFFEL_SEARCH_OFFERS",state.multiSearchQueue.shift());
          }else{
            state.multiSearchActive=false;
          }
          navigate("search");
          toast("Independent route search failed",payload.message||"A supplier route could not be searched.","warning");
          if(!state.multiSearchActive)toast("Multi-search finished",`${state.multiSearchCompleted} succeeded, ${state.multiSearchFailed} failed; ${state.offers.length} distinct offers.`,state.multiSearchFailed?"warning":"success");
          return;
        }
        // A single provider failure does not imply the Wix parent bridge is offline.
        if (payload.code === "AUTH_REQUIRED") { state.connected = false; render(); }
        toast("Action failed", payload.message || "The reservation action could not be completed.", "danger");
      }
    }


    function upsertAlteaBooking(booking){
      if(!booking?.id)return;
      state.alteaBookings=[booking,...state.alteaBookings.filter(item=>item.id!==booking.id)];
    }


    function upsertOrder(order) {
      if (!order?.id) return;
      state.orders = [order, ...state.orders.filter((item) => item.id !== order.id)];
    }


    function selectedServicePayload() {
      return Array.from(state.selectedServices.values()).map((service) => ({ id: service.id, quantity: Number(service.quantity || 1) }));
    }


    function selectedServiceTotal() {
      const currency = state.selectedOffer?.totalCurrency;
      return Array.from(state.selectedServices.values()).reduce((sum, service) => {
        if (service.totalCurrency !== currency) return sum;
        return sum + Number(service.totalAmount || 0) * Number(service.quantity || 1);
      }, 0);
    }


    function orderTotal() {
      if (state.paymentPurpose === "order" && state.payment?.amount && state.payment?.currency === state.selectedOffer?.totalCurrency) {
        return Number(state.payment.amount);
      }
      return Number(state.selectedOffer?.totalAmount || 0) + selectedServiceTotal();
    }


    function paymentIsCommitted() {
      return ["succeeded", "processing", "requires_capture"].includes(state.payment?.status);
    }

    function paymentSessionStarted() {
      return Boolean(state.payment?.paymentIntentId || state.paymentPrepareRequestId);
    }


    function requestOrderPaymentPreparation() {
      if (paymentSessionStarted() || paymentIsCommitted()) {
        return toast("Payment in progress", "Complete or reconcile the existing payment before preparing another.", "warning");
      }
      const offerId = state.selectedOffer?.id;
      if (!offerId || skandiDuffelOfferExpiredNow(state.selectedOffer)) {
        return toast("Offer unavailable", "Refresh a valid offer before starting payment.", "warning");
      }
      const requestId = post("DUFFEL_PREPARE_PAYMENT", {
        offerId,
        services: selectedServicePayload()
      });
      if (requestId) {
        state.paymentPrepareRequestId = requestId;
        state.paymentPrepareOfferId = offerId;
      }
    }


    function invalidatePayment() {
      state.payment = null;
      state.paymentPurpose = null;
      destroyStripe();
    }


    function destroyStripe() {
      try { state.stripePaymentElement?.destroy(); } catch (_) {}
      state.stripe = null;
      state.stripeElements = null;
      state.stripePaymentElement = null;
    }


    function openModal(title, body, buttons = [], options = {}) {
      $("#modalRoot").innerHTML = `<div class="modal-backdrop">
        <div class="modal ${options.size || ""}" role="dialog" aria-modal="true" aria-label="${escapeAttr(title)}">
          <div class="modal-head"><span>${escapeHTML(title)}</span><button data-close-modal aria-label="Close">×</button></div>
          <div class="modal-body">${body}</div>
          <div class="modal-foot">${buttons.map((button, index) => `<button class="${button.className || "secondary"}" data-modal-index="${index}">${escapeHTML(button.label)}</button>`).join("")}</div>
        </div>
      </div>`;
      $("[data-close-modal]").addEventListener("click", closeModal);
      $(".modal-backdrop").addEventListener("click", (event) => {
        if (event.target.classList.contains("modal-backdrop")) closeModal();
      });
      buttons.forEach((button, index) => {
        $(`[data-modal-index="${index}"]`).addEventListener("click", () => button.close ? closeModal() : button.onClick?.());
      });
      options.onMount?.();
    }


    function closeModal() {
      $("#modalRoot").innerHTML = "";
    }


    function toast(title, message, type = "info") {
      const element = document.createElement("div");
      element.className = `toast ${type}`;
      const strong = document.createElement("strong");
      strong.textContent = title;
      const content = document.createElement("div");
      content.className = "muted";
      content.style.marginTop = "3px";
      content.textContent = message;
      element.append(strong, content);
      $("#toastStack").appendChild(element);
      setTimeout(() => {
        element.style.opacity = "0";
        element.style.transform = "translateX(12px)";
        setTimeout(() => element.remove(), 180);
      }, 4500);
    }


    function alertBox(type, title, message) {
      return `<div class="alert ${type}"><span>${type === "danger" ? "!" : type === "warning" ? "⚠" : "ℹ"}</span><div><strong>${escapeHTML(title)}</strong>${escapeHTML(message)}</div></div>`;
    }


    function emptyState(icon, title, message) {
        return `<div class="panel empty"><div class="big">${icon}</div><strong>${escapeHTML(title)}</strong><br><span>${escapeHTML(message)}</span></div>`;
    }


    function statCard(label, value, meta) {
      return `<div class="stat"><div class="stat-label">${escapeHTML(label)}</div><div class="stat-value">${escapeHTML(String(value))}</div><div class="stat-meta">${escapeHTML(meta)}</div></div>`;
    }


    function stepLine(done, number, label) {
      return `<div class="money-line"><span><span class="badge ${done ? "success" : "neutral"}">${escapeHTML(number)}</span> ${escapeHTML(label)}</span><strong>${done ? "✓" : ""}</strong></div>`;
    }


    function numberOptions(min, max, selected) {
      return Array.from({ length: max - min + 1 }, (_, index) => {
        const value = min + index;
        return `<option value="${value}" ${value === selected ? "selected" : ""}>${value}</option>`;
      }).join("");
    }


    function option(value, label, selected) {
      return `<option value="${escapeAttr(value)}" ${value === selected ? "selected" : ""}>${escapeHTML(label)}</option>`;
    }


    function parseAges(raw, min, max, label) {
      if (!raw.trim()) return [];
      const ages = raw.split(",").map((value) => Number(value.trim()));
      if (ages.some((age) => !Number.isInteger(age) || age < min || age > max)) {
        toast(`Invalid ${label.toLowerCase()} ages`, `${label} ages must be whole numbers from ${min} to ${max}, separated by commas.`, "warning");
        return null;
      }
      return ages;
    }


    function iata(value) {
      const code = String(value || "").trim().toUpperCase();
      return /^[A-Z]{3}$/.test(code) ? code : "";
    }


    function money(amount, currency = "USD") {
      const value = Number(amount);
      if (!Number.isFinite(value)) return "—";
      try {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(value);
      } catch (_) {
        return `${currency || ""} ${value.toFixed(2)}`.trim();
      }
    }


    function isoDate(date) {
      return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    }


    function formatDateTime(value) {
      if (!value) return "—";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
    }
    
    function formatPrinterDate(dateString) {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; 
        // Fallback if invalid
        const day = String(date.getDate()).padStart(2, '0');
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const month = months[date.getMonth()];
        return `${day}${month}`; // Example: "15NOV"
        }


    function formatShortDate(value) {
      if (!value) return "—";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
    }


    function timeOnly(value) {
      if (!value) return "—";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "—";
      return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(date);
    }
    function formatBoardingNumber(seqString) {
  if (!seqString) return "";
  const num = parseInt(seqString, 10);
  return isNaN(num) ? seqString : String(num);
}

    function expiryLabel(value) {
      if (!value) return "Expiry unknown";
      const diff = new Date(value).getTime() - Date.now();
      if (diff <= 0) return "Expired";
      return `Expires in ${Math.max(1, Math.floor(diff / 60000))}m`;
    }


    function expiryClass(value) {
      if (!value) return "warning";
      return new Date(value).getTime() <= Date.now() ? "danger" : "warning";
    }


    function statusClass(status) {
      const normalized = String(status || "").toLowerCase();
      if (normalized.includes("cancel") || normalized.includes("fail")) return "danger";
      if (normalized.includes("confirm") || normalized.includes("active")) return "success";
      if (normalized.includes("hold") || normalized.includes("pending")) return "warning";
      return "neutral";
    }


    function shortId(value) {
      const text = String(value || "");
      return text.length > 22 ? `${text.slice(0, 11)}…${text.slice(-7)}` : text;
    }


    function humanize(value) {
      return String(value || "").replace(/[_-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
    }


    function unique(values) {
      return [...new Set(values)];
    }


    function csvCell(value) {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    }


    function escapeHTML(value) {
      return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
      })[character]);
    }


    function escapeAttr(value) {
      return escapeHTML(value).replace(/`/g, "&#096;");
    }


    function bindShellEvents() {
      const sidebar = document.querySelector(".sidebar");
      if (sidebar && !sidebar.dataset.navBound) {
        sidebar.dataset.navBound = "1";
        sidebar.addEventListener("click", (event) => {
          const button = event.target.closest("[data-view]");
          if (!button || !sidebar.contains(button)) return;
          event.preventDefault();
          navigate(button.dataset.view);
        });
      }
      
      const sidebarToggle = $("#sidebarToggle");
      if (sidebarToggle) {
        sidebarToggle.addEventListener("click", () => $("#app").classList.toggle("sidebar-collapsed"));
      }


      window.addEventListener("message", beginSessionMessageRoute, true);
      window.addEventListener("message", handleParentMessage);
    }


    function startBridgeHandshake() {
      let attempts = 0;
      const sendReady = () => {
        attempts += 1;
        post("DUFFEL_APP_READY", { version: "R-006.3-unified", attempt: attempts }, { busy: false });
        post("ALTEA_UNIFIED_BOOTSTRAP", { version: "R-006.3-unified", attempt: attempts }, { busy: false });
      };
      sendReady();
      const retryTimer = window.setInterval(() => {
        if (state.bridgeConnected || attempts >= 10) {
          window.clearInterval(retryTimer);
          return;
        }
        sendReady();
      }, 1200);
    }


    bindShellEvents();
    render();
    startBridgeHandshake();
  


