import { webMethod, Permissions } from "wix-web-module";
import { searchUnifiedOffers } from "./bookingOrchestrator.web.js";

// Compatibility adapter for destination pages.
// Live airline availability now uses the same backend-only provider adapter as the booking flow.
export const getDestinationFlightSuggestions = webMethod(Permissions.Anyone, async (input = {}) => {
  const request = input.search || input || {};
  const max = Math.min(Math.max(Number(request.max) || 6, 1), 20);
  const search = {
    ...request,
    tripType: "flightOnly",
    origin: request.originIata || request.origin || request.originLocationCode || "",
    destination: request.destinationIata || request.destination || request.destinationLocationCode || "",
    departureDate: request.departureDate,
    returnDate: request.returnDate,
    adults: Number(request.adults) || 1,
    children: Number(request.children) || 0,
    infants: Number(request.infants) || 0,
    childAges: Array.isArray(request.childAges) ? request.childAges : [],
    infantAges: Array.isArray(request.infantAges) ? request.infantAges : [],
    travelClass: request.cabin || request.travelClass || "economy",
    currency: request.currency || "USD",
    nonStop: request.nonStop === true
  };

  const result = await searchUnifiedOffers({ search });
  const offers = (Array.isArray(result?.items) ? result.items : []).slice(0, max).map(offer => ({
    id: offer.offerId || offer.id || "",
    offerId: offer.offerId || offer.id || "",
    rawOffer: offer,
    currency: offer.currency || offer.price?.currency || search.currency,
    total: Number(offer.total ?? offer.price?.amount ?? 0),
    origin: search.origin,
    destination: search.destination,
    departureAt: offer.departureAt || "",
    arrivalAt: offer.arrivalAt || "",
    duration: offer.summary || "",
    stops: Array.isArray(offer.badges) && offer.badges.some(x => /nonstop/i.test(String(x))) ? 0 : null,
    validatingAirlineCodes: [],
    itineraries: [],
    source: "LIVE_AIR"
  }));

  const totals = offers.map(x => x.total).filter(x => Number.isFinite(x) && x > 0);
  return {
    ok: true,
    offers,
    dictionaries: {},
    priceSummary: totals.length ? { from: Math.min(...totals), currency: offers[0]?.currency || search.currency } : null
  };
});
