import { webMethod, Permissions } from "wix-web-module";
import { currentMember } from "wix-members-backend";
import {
  searchFlightOffers,
  priceFlightOffer
} from "./amadeusClient.js";
import {
  findAgentByMemberOrEmail,
  isAgentAuthorized,
  publicAgent
} from "./staffPortalAuth.repository.js";

import {
  getAlteaDashboardSnapshot,
  searchAlteaBookings,
  getAlteaBookingDetails,
  createAlteaBookingDraft,
  updateAlteaBooking,
  upsertAlteaPassengers,
  upsertAlteaSegments,
  saveOfferCache,
  getOfferCacheByCacheId,
  listPackageInventory,
  saveQueueItem,
  updateQueueItemStatus,
  saveFidsFlight,
  insertPnrHistory,
  insertSyncEvent
} from "./alteaMaster.repository.js";

function getMemberEmail(member = {}) {
  return (
    member.loginEmail ||
    member.contactDetails?.email ||
    member.contactDetails?.emails?.[0] ||
    ""
  );
}

async function requireStaffAgent() {
  const member = await currentMember.getMember({ fieldsets: ["FULL"] });

  if (!member?._id) {
    throw new Error("Staff login required.");
  }

  const agent = await findAgentByMemberOrEmail({
    memberId: member._id,
    email: getMemberEmail(member)
  });

  if (!isAgentAuthorized(agent)) {
    throw new Error("Not authorized for ALTEA.");
  }

  return {
    member,
    agent,
    staff: publicAgent({
      ...agent,
      member_id: member._id
    })
  };
}

function cleanText(value, max = 180) {
  return String(value || "").trim().slice(0, max);
}

function cleanCommand(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

function cleanLocator(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

export const getAlteaMasterState = webMethod(
  Permissions.Anyone,
  async () => {
    const { staff } = await requireStaffAgent();
    const snapshot = await getAlteaDashboardSnapshot();

    return {
      staff,
      snapshot
    };
  }
);

export const searchAlteaMasterBookings = webMethod(
  Permissions.Anyone,
  async ({ query } = {}) => {
    await requireStaffAgent();

    const bookings = await searchAlteaBookings(query || "");

    return {
      bookings
    };
  }
);

export const getAlteaMasterBooking = webMethod(
  Permissions.Anyone,
  async ({ bookingId } = {}) => {
    await requireStaffAgent();

    const details = await getAlteaBookingDetails(bookingId);

    return details;
  }
);
export const searchAlteaAmadeusFlightOffers = webMethod(
  Permissions.Anyone,
  async ({ search } = {}) => {
    const { agent } = await requireStaffAgent();

    const result = await searchFlightOffers(search || {});
    const rawOffers = result?.data || [];
    const dictionaries = result?.dictionaries || {};

    const searchKey = [
      search?.origin || search?.originLocationCode || "",
      search?.destination || search?.destinationLocationCode || "",
      search?.departureDate || "",
      search?.returnDate || "",
      search?.adults || 1
    ].join("-").toUpperCase();

    const cachedOffers = [];

    for (let i = 0; i < rawOffers.length; i += 1) {
      const rawOffer = rawOffers[i];
      const price = rawOffer.price || {};
      const offerCacheId = `AMD-${Date.now().toString(36).toUpperCase()}-${i + 1}`;

      const cached = await saveOfferCache({
        offerCacheId,
        source: "amadeus",
        searchKey,
        productType: "FLIGHT_ONLY",
        origin: search?.origin || search?.originLocationCode || "",
        destination: search?.destination || search?.destinationLocationCode || "",
        departureDate: search?.departureDate || "",
        returnDate: search?.returnDate || "",
        adults: search?.adults || 1,
        currency: price.currency || search?.currency || "SEK",
        priceTotal: price.grandTotal || price.total || 0,
        priceTax: 0,
        payload: {
          rawOffer,
          dictionaries,
          search
        }
      }, agent.id);

      cachedOffers.push(mapAmadeusOffer(rawOffer, cached?.offer_cache_id, dictionaries));
    }

    await insertSyncEvent({
      sourceSystem: "amadeus",
      eventType: "flight_offer_search_completed",
      entityType: "altea_offer_cache",
      status: "success",
      message: `${cachedOffers.length} Amadeus offers returned.`,
      payload: {
        searchKey,
        count: cachedOffers.length
      },
      agentUserId: agent.id
    });

    return {
      offers: cachedOffers,
      dictionaries
    };
  }
);

export const priceAlteaAmadeusOffer = webMethod(
  Permissions.Anyone,
  async ({ offerCacheId, offer } = {}) => {
    const { agent } = await requireStaffAgent();

    let rawOffer = offer || null;
    let cached = null;

    if (!rawOffer && offerCacheId) {
      cached = await getOfferCacheByCacheId(offerCacheId);
      rawOffer =
        cached?.payload?.rawOffer ||
        cached?.payload?.offer ||
        null;
    }

    if (!rawOffer) {
      throw new Error("Missing Amadeus offer to price.");
    }

    const priced = await priceFlightOffer(rawOffer);
    const pricedOffer = priced?.data?.flightOffers?.[0] || rawOffer;

    await insertSyncEvent({
      sourceSystem: "amadeus",
      eventType: "flight_offer_priced",
      entityType: "altea_offer_cache",
      entityId: cached?.id || "",
      status: "success",
      message: "Amadeus offer priced.",
      payload: {
        offerCacheId,
        price: pricedOffer?.price || {}
      },
      agentUserId: agent.id
    });

    return {
      offer: mapAmadeusOffer(pricedOffer, offerCacheId, priced?.dictionaries || {}),
      rawPricedOffer: pricedOffer,
      rawResponse: priced
    };
  }
);

function mapAmadeusOffer(offer = {}, offerCacheId = "", dictionaries = {}) {
  const itineraries = offer.itineraries || [];
  const firstSegment = itineraries?.[0]?.segments?.[0] || {};
  const lastItinerary = itineraries[itineraries.length - 1] || {};
  const lastSegments = lastItinerary.segments || [];
  const lastSegment = lastSegments[lastSegments.length - 1] || firstSegment;

  const carrierCode =
    firstSegment.carrierCode ||
    offer.validatingAirlineCodes?.[0] ||
    "";

  const airlineName =
    dictionaries?.carriers?.[carrierCode] ||
    carrierCode ||
    "Amadeus";

  const price = offer.price || {};

  return {
    id: offerCacheId || offer.id || "",
    offerCacheId,
    source: "amadeus",
    supplierSource: "amadeus",
    productType: "flight",
    title: `${airlineName} ${firstSegment.number || ""}`.trim(),
    summary: [
      firstSegment.departure?.iataCode || "",
      lastSegment.arrival?.iataCode || "",
      firstSegment.departure?.at ? firstSegment.departure.at.slice(0, 10) : ""
    ].filter(Boolean).join(" → "),
    origin: firstSegment.departure?.iataCode || "",
    destination: lastSegment.arrival?.iataCode || "",
    departureDate: firstSegment.departure?.at ? firstSegment.departure.at.slice(0, 10) : "",
    returnDate: itineraries.length > 1
      ? itineraries[1]?.segments?.[0]?.departure?.at?.slice(0, 10) || ""
      : "",
    validatingAirlineCodes: offer.validatingAirlineCodes || [],
    price: {
      currency: price.currency || "SEK",
      amount: Number(price.grandTotal || price.total || 0)
    },
    availability: offer.numberOfBookableSeats || null,
    rawOffer: offer
  };
}
export const createAlteaMasterBookingDraft = webMethod(
  Permissions.Anyone,
  async ({ booking } = {}) => {
    const { agent } = await requireStaffAgent();

    const result = await createAlteaBookingDraft(booking || {}, agent.id);

    await insertSyncEvent({
      sourceSystem: "riaintra-altea",
      eventType: "booking_draft_created",
      entityType: "altea_booking",
      entityId: result?.id,
      status: "success",
      message: "ALTEA booking draft created.",
      payload: {
        bookingReference: result?.booking_reference,
        pnrLocator: result?.pnr_locator
      },
      agentUserId: agent.id
    });

    return {
      booking: result
    };
  }
);

export const saveAlteaMasterBooking = webMethod(
  Permissions.Anyone,
  async ({ bookingId, booking, passengers, segments } = {}) => {
    const { agent } = await requireStaffAgent();

    const updated = await updateAlteaBooking(bookingId, booking || {}, agent.id);

    let savedPassengers = [];
    let savedSegments = [];

    if (Array.isArray(passengers)) {
      savedPassengers = await upsertAlteaPassengers(updated.id, passengers);
    }

    if (Array.isArray(segments)) {
      savedSegments = await upsertAlteaSegments(updated.id, segments);
    }

    await insertSyncEvent({
      sourceSystem: "riaintra-altea",
      eventType: "booking_saved",
      entityType: "altea_booking",
      entityId: updated?.id,
      status: "success",
      message: "ALTEA booking saved.",
      payload: {
        passengers: savedPassengers.length,
        segments: savedSegments.length
      },
      agentUserId: agent.id
    });

    return {
      booking: updated,
      passengers: savedPassengers,
      segments: savedSegments
    };
  }
);

export const saveAlteaMasterPassengers = webMethod(
  Permissions.Anyone,
  async ({ bookingId, passengers } = {}) => {
    const { agent } = await requireStaffAgent();

    const result = await upsertAlteaPassengers(bookingId, passengers || []);

    await insertPnrHistory({
      bookingId,
      eventType: "passengers_updated",
      afterState: result,
      agentUserId: agent.id
    });

    return {
      passengers: result
    };
  }
);

export const saveAlteaMasterSegments = webMethod(
  Permissions.Anyone,
  async ({ bookingId, segments } = {}) => {
    const { agent } = await requireStaffAgent();

    const result = await upsertAlteaSegments(bookingId, segments || []);

    await insertPnrHistory({
      bookingId,
      eventType: "segments_updated",
      afterState: result,
      agentUserId: agent.id
    });

    return {
      segments: result
    };
  }
);

export const cacheAlteaMasterOffer = webMethod(
  Permissions.Anyone,
  async ({ offer } = {}) => {
    const { agent } = await requireStaffAgent();

    const result = await saveOfferCache(offer || {}, agent.id);

    await insertSyncEvent({
      sourceSystem: "amadeus",
      eventType: "offer_cached",
      entityType: "altea_offer_cache",
      entityId: result?.id,
      status: "success",
      message: "Offer cached.",
      payload: {
        offerCacheId: result?.offer_cache_id,
        source: result?.source
      },
      agentUserId: agent.id
    });

    return {
      offer: result
    };
  }
);

export const getAlteaPackageInventory = webMethod(
  Permissions.Anyone,
  async ({ filters } = {}) => {
    await requireStaffAgent();

    const inventory = await listPackageInventory(filters || {});

    return {
      inventory
    };
  }
);

export const createAlteaQueueItem = webMethod(
  Permissions.Anyone,
  async ({ item } = {}) => {
    const { agent } = await requireStaffAgent();

    const result = await saveQueueItem(item || {}, agent.id);

    return {
      item: result
    };
  }
);

export const setAlteaQueueItemStatus = webMethod(
  Permissions.Anyone,
  async ({ queueItemId, status } = {}) => {
    const { agent } = await requireStaffAgent();

    const result = await updateQueueItemStatus(queueItemId, status, agent.id);

    return {
      item: result
    };
  }
);

export const saveAlteaFidsFlight = webMethod(
  Permissions.Anyone,
  async ({ flight } = {}) => {
    const { agent } = await requireStaffAgent();

    const result = await saveFidsFlight(flight || {}, agent.id);

    await insertSyncEvent({
      sourceSystem: "fids",
      eventType: "flight_saved",
      entityType: "altea_fids_flight",
      entityId: result?.id,
      status: "success",
      message: "FIDS flight saved.",
      payload: {
        flightKey: result?.flight_key,
        flightNumber: result?.flight_number
      },
      agentUserId: agent.id
    });

    return {
      flight: result
    };
  }
);

export const runAlteaTerminalCommand = webMethod(
  Permissions.Anyone,
  async ({ command, bookingId } = {}) => {
    const { agent } = await requireStaffAgent();

    const cmd = cleanCommand(command);

    if (!cmd) {
      throw new Error("Missing command.");
    }

    const result = await handleTerminalCommand({
      command: cmd,
      bookingId,
      agentUserId: agent.id
    });

    return result;
  }
);

export const logAlteaSyncEvent = webMethod(
  Permissions.Anyone,
  async ({ event } = {}) => {
    const { agent } = await requireStaffAgent();

    const result = await insertSyncEvent({
      sourceSystem: cleanText(event?.sourceSystem, 80) || "riaintra-altea",
      eventType: cleanText(event?.eventType, 100) || "manual_event",
      entityType: cleanText(event?.entityType, 80) || null,
      entityId: cleanText(event?.entityId, 100) || null,
      status: cleanText(event?.status, 40) || "success",
      message: cleanText(event?.message, 500) || null,
      payload: event?.payload || {},
      agentUserId: agent.id
    });

    return {
      event: result
    };
  }
);

async function handleTerminalCommand({ command, bookingId, agentUserId }) {
  const parts = command.split(" ");
  const op = parts[0];
  if (op === "AN") {
  await insertPnrHistory({
    bookingId: bookingId || null,
    command,
    eventType: "terminal_air_availability",
    payload: {
      mode: "air_availability",
      command
    },
    agentUserId
  });

  return {
    ok: true,
    command,
    eventType: "terminal_air_availability",
    output: "AN AVAILABILITY REQUEST LOGGED"
  };
}

if (op === "FXP") {
  await insertPnrHistory({
    bookingId: bookingId || null,
    command,
    eventType: "terminal_price_pnr",
    payload: {
      mode: "pricing",
      command
    },
    agentUserId
  });

  return {
    ok: true,
    command,
    eventType: "terminal_price_pnr",
    output: "FXP PRICING REQUEST LOGGED"
  };
}

if (op === "TTP") {
  await insertPnrHistory({
    bookingId: bookingId || null,
    command,
    eventType: "terminal_ticket_issue_requested",
    payload: {
      mode: "ticketing",
      command
    },
    agentUserId
  });

  return {
    ok: true,
    command,
    eventType: "terminal_ticket_issue_requested",
    output: "TTP ISSUE REQUEST LOGGED - LIVE TICKETING CONFIRMATION STILL REQUIRED"
  };
}

if (op === "NM") {
  await insertPnrHistory({
    bookingId: bookingId || null,
    command,
    eventType: "terminal_name_element",
    payload: {
      mode: "name_element",
      command
    },
    agentUserId
  });

  return {
    ok: true,
    command,
    eventType: "terminal_name_element",
    output: "NM NAME ELEMENT LOGGED"
  };
}

if (op === "SS") {
  await insertPnrHistory({
    bookingId: bookingId || null,
    command,
    eventType: "terminal_sell_segment",
    payload: {
      mode: "sell_segment",
      command
    },
    agentUserId
  });

  return {
    ok: true,
    command,
    eventType: "terminal_sell_segment",
    output: "SS SEGMENT SELL REQUEST LOGGED"
  };
}

  if (op === "RT") {
    const locator = cleanLocator(parts[1]);

    await insertPnrHistory({
      bookingId: bookingId || null,
      pnrLocator: locator,
      command,
      eventType: "terminal_rt",
      payload: {
        mode: "retrieve_pnr",
        locator
      },
      agentUserId
    });

    if (!locator) {
      return {
        ok: false,
        command,
        output: "FORMAT ERROR - USE RT LOCATOR"
      };
    }

    return {
      ok: true,
      command,
      output: `PNR ${locator} RETRIEVE REQUEST ACCEPTED\nLIVE AMADEUS RETRIEVE WILL BE CONNECTED THROUGH BACKEND API MODULE.`
    };
  }

  if (op === "RH") {
    await insertPnrHistory({
      bookingId: bookingId || null,
      command,
      eventType: "terminal_rh",
      payload: {
        mode: "history"
      },
      agentUserId
    });

    return {
      ok: true,
      command,
      output: "RH HISTORY REQUEST ACCEPTED"
    };
  }

  if (op === "ER" || op === "ET") {
    await insertPnrHistory({
      bookingId: bookingId || null,
      command,
      eventType: op === "ER" ? "terminal_end_retrieve" : "terminal_end_transaction",
      payload: {
        mode: op
      },
      agentUserId
    });

    return {
      ok: true,
      command,
      output: `${op} ACCEPTED`
    };
  }

  if (op === "IG") {
    await insertPnrHistory({
      bookingId: bookingId || null,
      command,
      eventType: "terminal_ignore",
      payload: {
        mode: "ignore"
      },
      agentUserId
    });

    return {
      ok: true,
      command,
      output: "IGNORED"
    };
  }

  await insertPnrHistory({
    bookingId: bookingId || null,
    command,
    eventType: "terminal_unknown_command",
    payload: {
      mode: "unknown"
    },
    agentUserId
  });

  return {
    ok: false,
    command,
    output: `COMMAND NOT IMPLEMENTED: ${command}`
  };
}