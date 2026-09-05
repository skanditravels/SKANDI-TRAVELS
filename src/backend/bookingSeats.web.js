import { webMethod, Permissions } from "wix-web-module";
import { loadBookingCart, requireBookingCartAccess } from "./bookingCart.repository.js";
import { restRequest } from "./RIA/supabaseServer.js";
import { travelProviderRequest } from "./liveTravelProvider.js";

function text(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function money(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function cartPayload(cart) {
  return cart && typeof cart === "object" ? cart : {};
}

async function loadRawCart(cartId, cartToken) {
  const rows = await restRequest({
    table: "booking_carts",
    query: {
      select: "*",
      cart_id: `eq.${text(cartId, 120)}`,
      limit: 1
    }
  });
  const row = rows?.[0];
  if (!row) throw new Error("BOOKING_CART_NOT_FOUND");
  requireBookingCartAccess(row, cartToken);
  return row;
}


function displayTraveler(cartTraveler = {}, providerPassenger = {}, index = 0) {
  const firstName =
    text(cartTraveler.givenName || cartTraveler.firstName || cartTraveler?.name?.firstName, 80) ||
    `Traveler ${index + 1}`;
  const lastName =
    text(cartTraveler.familyName || cartTraveler.lastName || cartTraveler?.name?.lastName, 80);
  return {
    id: providerPassenger.id || String(index + 1),
    travelerId: providerPassenger.id || String(index + 1),
    firstName,
    lastName,
    type: providerPassenger.type || cartTraveler.travelerType || "",
    age: providerPassenger.age ?? null
  };
}

function serviceSummary(service = {}, seatDesignator = "", segmentId = "") {
  const passengerIds = service.passenger_ids || (service.passenger_id ? [service.passenger_id] : []);
  const segmentIds = service.segment_ids || (service.segment_id ? [service.segment_id] : []);
  return {
    id: service.id || "",
    serviceId: service.id || "",
    seat: seatDesignator,
    segmentId: segmentId || segmentIds[0] || "",
    passengerIds,
    segmentIds,
    amount: money(service.total_amount),
    currency: text(service.total_currency || "", 3).toUpperCase(),
    maximumQuantity: Number(service.maximum_quantity || 1)
  };
}

function normalizeSeatMaps(rawMaps = []) {
  const segments = [];
  const serviceCatalog = new Map();

  for (const map of Array.isArray(rawMaps) ? rawMaps : []) {
    const segmentId = map?.segment_id || "";
    const seats = [];

    for (const cabin of map?.cabins || []) {
      for (const row of cabin?.rows || []) {
        for (const section of row?.sections || []) {
          for (const element of section?.elements || []) {
            if (element?.type !== "seat") continue;
            const designator = element.designator || "";
            const services = (element.available_services || [])
              .map((service) => serviceSummary(service, designator, segmentId))
              .filter((service) => service.serviceId);

            services.forEach((service) => serviceCatalog.set(service.serviceId, service));

            seats.push({
              designator,
              row: Number.parseInt(String(designator).replace(/\D+/g, ""), 10) || null,
              column: String(designator).replace(/\d+/g, ""),
              cabinClass: cabin.cabin_class || "",
              cabinName: cabin.cabin_class_marketing_name || cabin.cabin_class || "",
              disclosures: element.disclosures || [],
              services
            });
          }
        }
      }
    }

    segments.push({
      id: segmentId,
      segmentId,
      sliceId: map?.slice_id || "",
      seats
    });
  }

  return { segments, serviceCatalog };
}

async function fetchSeatMapsForCart(cart) {
  const offerId = cart?.flight?.offerId || cartPayload(cart)?.flight?.offerId || "";
  if (!offerId) {
    return {
      unavailable: true,
      reason: "Seat selection is not required because this booking does not contain a flight.",
      segments: [],
      serviceCatalog: new Map()
    };
  }

  try {
    const response = await travelProviderRequest("/air/seat_maps", {
      query: { offer_id: offerId }
    });
    const normalized = normalizeSeatMaps(response?.data || []);
    if (!normalized.segments.some((segment) => segment.seats.length)) {
      return {
        unavailable: true,
        reason: "Seat selection is not available for this flight. You can continue and choose seats later where supported.",
        segments: [],
        serviceCatalog: normalized.serviceCatalog
      };
    }
    return {
      unavailable: false,
      reason: "",
      segments: normalized.segments,
      serviceCatalog: normalized.serviceCatalog
    };
  } catch (error) {
    console.warn("[BookingSeats] Live seat map unavailable.", error);
    return {
      unavailable: true,
      reason: "Seat selection is not available for this flight right now. You can continue without selecting a seat.",
      segments: [],
      serviceCatalog: new Map()
    };
  }
}

export const getSeatmapForCart = webMethod(Permissions.Anyone, async ({ cartId, cartToken } = {}) => {
  const cart = await loadBookingCart(cartId, cartToken);
  const live = await fetchSeatMapsForCart(cart);

  const providerPassengers = cart?.flight?.offer?.passengers || [];
  const travelers = Array.isArray(cart.travelers) ? cart.travelers : [];
  const travelerRows = providerPassengers.length
    ? providerPassengers.map((passenger, index) => displayTraveler(travelers[index] || {}, passenger, index))
    : travelers.map((traveler, index) => displayTraveler(traveler, {}, index));

  return {
    ok: true,
    cartId: cart.cartId,
    unavailable: live.unavailable,
    reason: live.reason,
    seatmap: {
      segments: live.segments
    },
    travelers: travelerRows,
    existingSelections:
      cart.seatSelections && typeof cart.seatSelections === "object"
        ? cart.seatSelections
        : {}
  };
});

export const saveSeatSelections = webMethod(Permissions.Anyone, async ({
  cartId,
  cartToken,
  selections = {},
  skipped = false
} = {}) => {
  const [cart, rawCart] = await Promise.all([
    loadBookingCart(cartId, cartToken),
    loadRawCart(cartId, cartToken)
  ]);

  let confirmedSelections = {};
  if (!skipped) {
    const live = await fetchSeatMapsForCart(cart);
    if (live.unavailable) {
      throw new Error("BOOKING_SEATMAP_UNAVAILABLE");
    }

    const rawSelections = selections && typeof selections === "object" ? selections : {};
    for (const [key, value] of Object.entries(rawSelections)) {
      const selection = value && typeof value === "object" ? value : {};
      const serviceId = text(selection.serviceId, 160);
      if (!serviceId) continue;

      const service = live.serviceCatalog.get(serviceId);
      if (!service) throw new Error("BOOKING_SEAT_UNAVAILABLE");

      const passengerId = text(selection.passengerId, 160);
      const segmentId = text(selection.segmentId || service.segmentId, 160);
      if (
        passengerId &&
        service.passengerIds.length &&
        !service.passengerIds.includes(passengerId)
      ) {
        throw new Error("BOOKING_SEAT_TRAVELER_MISMATCH");
      }
      if (
        segmentId &&
        service.segmentIds.length &&
        !service.segmentIds.includes(segmentId)
      ) {
        throw new Error("BOOKING_SEAT_SEGMENT_MISMATCH");
      }

      confirmedSelections[key] = {
        seat: service.seat,
        serviceId: service.id,
        passengerId,
        segmentId: segmentId || service.segmentId,
        amount: service.amount,
        currency: service.currency
      };
    }
  }

  const rows = await restRequest({
    table: "booking_carts",
    method: "PATCH",
    query: { id: `eq.${rawCart.id}` },
    body: {
      payload: {
        ...(rawCart.payload || {}),
        seatSelections: confirmedSelections,
        seatMapSkipped: skipped === true,
        workflow: {
          ...(rawCart.payload?.workflow || {}),
          step: "payment"
        }
      },
      updated_at: new Date().toISOString()
    }
  });

  return {
    ok: true,
    cart: rows?.[0] || cart,
    selections: confirmedSelections,
    skipped: skipped === true
  };
});
