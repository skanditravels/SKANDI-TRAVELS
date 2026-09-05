import { webMethod, Permissions } from "wix-web-module";
import { loadBookingCart } from "./bookingCart.repository.js";

function text(value, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}

function money(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function flightSegments(cart = {}) {
  const slices = cart?.flight?.offer?.slices || [];
  const segments = [];
  for (const slice of slices) {
    for (const segment of slice?.segments || []) {
      const origin = segment?.origin?.iataCode || "";
      const destination = segment?.destination?.iataCode || "";
      const carrier = segment?.marketingCarrier?.name || segment?.marketingCarrier?.iataCode || "";
      const carrierCode = segment?.marketingCarrier?.iataCode || "";
      const flightNumber = segment?.marketingFlightNumber || "";
      const departureAt = segment?.departingAt || "";
      const arrivalAt = segment?.arrivingAt || "";
      segments.push({
        origin,
        destination,
        carrier,
        carrierCode,
        flightNumber,
        departureAt,
        arrivalAt,
        date: departureAt ? String(departureAt).slice(0, 10) : "",
        route: [origin, destination].filter(Boolean).join(" → ")
      });
    }
  }
  return segments;
}

function travelers(cart = {}) {
  return (Array.isArray(cart.travelers) ? cart.travelers : []).map((traveler, index) => {
    const firstName = text(
      traveler?.givenName ||
      traveler?.firstName ||
      traveler?.name?.firstName ||
      traveler?.name?.givenName ||
      "",
      80
    );
    const lastName = text(
      traveler?.familyName ||
      traveler?.lastName ||
      traveler?.name?.lastName ||
      traveler?.name?.familyName ||
      "",
      80
    );
    return {
      id: traveler?.id || String(index + 1),
      firstName,
      lastName,
      fullName: [firstName, lastName].filter(Boolean).join(" ") || `Traveler ${index + 1}`,
      dateOfBirth: traveler?.dateOfBirth || "",
      nationality: traveler?.nationality || ""
    };
  });
}

function bookingKind(cart = {}) {
  const hasFlight = Boolean(cart?.flight?.offer);
  const hasHotel = Boolean(cart?.stay?.quote);
  if (hasFlight && hasHotel) return "Flight + Hotel";
  if (hasFlight) return "Flight";
  if (hasHotel) return "Hotel";
  return text(cart?.productType || "Travel booking", 80);
}

function airReference(cart = {}) {
  return (
    cart?.airOrder?.bookingReference ||
    cart?.providerProgress?.airBookingReference ||
    ""
  );
}

function stayReference(cart = {}) {
  return (
    cart?.stayBooking?.reference ||
    cart?.providerProgress?.stayReference ||
    ""
  );
}

function primaryPassenger(cart = {}) {
  return travelers(cart)[0]?.fullName || "";
}

function confirmationFromCart(cart = {}) {
  const kind = bookingKind(cart);
  const airRef = airReference(cart);
  const stayRef = stayReference(cart);
  const hotelName = cart?.stay?.quote?.accommodation?.name || "";
  const segments = flightSegments(cart);

  const summaryParts = [];
  if (segments.length) {
    summaryParts.push(segments.map((segment) => segment.route).filter(Boolean).join(" / "));
  }
  if (hotelName) summaryParts.push(hotelName);
  if (!summaryParts.length) summaryParts.push("Your SKANDI booking is confirmed.");

  return {
    cartId: cart.cartId || "",
    title: `${kind} booking confirmed`,
    summary: summaryParts.join(" · "),
    bookingReference: cart.bookingReference || "",
    pnrLocator: airRef,
    hotelReference: stayRef,
    confirmationType: kind,
    status: cart.status || "Confirmed",
    total: money(cart.total),
    currency: cart.currency || "USD",
    primaryPassenger: primaryPassenger(cart),
    segments,
    hotelName,
    createdAt: cart?.workflow?.confirmedAt || ""
  };
}

export const getSourceAwareBookingConfirmation = webMethod(
  Permissions.Anyone,
  async ({ cartId, cartToken } = {}) => {
    const cart = await loadBookingCart(cartId, cartToken);
    const confirmation = confirmationFromCart(cart);
    return {
      ok: true,
      ...confirmation
    };
  }
);

export const getTravelDocumentsForCart = webMethod(
  Permissions.Anyone,
  async ({ cartId, cartToken } = {}) => {
    const cart = await loadBookingCart(cartId, cartToken);
    const confirmation = confirmationFromCart(cart);
    const docs = {
      confirmation
    };

    const segments = flightSegments(cart);
    if (segments.length) {
      docs.flightItinerary = {
        title: "Flight itinerary",
        bookingReference: confirmation.bookingReference,
        pnrLocator: confirmation.pnrLocator,
        primaryPassenger: confirmation.primaryPassenger,
        passengers: travelers(cart),
        segments,
        total: confirmation.total,
        currency: confirmation.currency
      };
    }

    if (cart?.stay?.quote) {
      docs.hotelVoucher = {
        title: "Hotel reservation",
        bookingReference: confirmation.bookingReference,
        hotelReference: confirmation.hotelReference,
        hotelName: cart.stay.quote?.accommodation?.name || "",
        roomName: cart.stay.quote?.roomName || "",
        boardType: cart.stay.quote?.boardType || "",
        checkInDate: cart?.stayBooking?.checkInDate || cart?.search?.departureDate || "",
        checkOutDate: cart?.stayBooking?.checkOutDate || cart?.search?.returnDate || "",
        address: cart.stay.quote?.accommodation?.address || null,
        guests: travelers(cart)
      };
    }

    const issued = Array.isArray(cart.travelDocuments) ? cart.travelDocuments : [];
    if (issued.length) {
      docs.issuedDocuments = {
        title: "Issued travel documents",
        items: issued.map((item) => ({
          id: item?.id || "",
          type: item?.type || "travel_document",
          uniqueIdentifier: item?.uniqueIdentifier || item?.unique_identifier || ""
        }))
      };
    }

    return {
      ok: true,
      cartId: cart.cartId,
      documents: docs,
      status: cart.status
    };
  }
);
