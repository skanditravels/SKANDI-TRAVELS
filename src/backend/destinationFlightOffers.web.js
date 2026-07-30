import { webMethod, Permissions } from 'wix-web-module';
import { searchFlightOffers } from './RIA/amadeusClient.js';

function amount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function mapOffer(offer = {}) {
  const itinerary = Array.isArray(offer.itineraries) ? offer.itineraries[0] : null;
  const segments = itinerary?.segments || [];
  const first = segments[0] || {};
  const last = segments[segments.length - 1] || {};
  return {
    id: offer.id || '',
    rawOffer: offer,
    currency: offer.price?.currency || 'SEK',
    total: amount(offer.price?.grandTotal || offer.price?.total),
    origin: first.departure?.iataCode || '',
    destination: last.arrival?.iataCode || '',
    departureAt: first.departure?.at || '',
    arrivalAt: last.arrival?.at || '',
    duration: itinerary?.duration || '',
    stops: Math.max(segments.length - 1, 0),
    validatingAirlineCodes: offer.validatingAirlineCodes || [],
    itineraries: offer.itineraries || [],
  };
}

export const getDestinationFlightSuggestions = webMethod(Permissions.Anyone, async (input = {}) => {
  const request = input.search || input;
  const response = await searchFlightOffers({
    origin: request.originIata || request.origin || request.originLocationCode,
    destination: request.destinationIata || request.destination || request.destinationLocationCode,
    departureDate: request.departureDate,
    returnDate: request.returnDate,
    adults: request.adults,
    children: request.children,
    infants: request.infants,
    travelClass: request.cabin || request.travelClass,
    currency: request.currency,
    nonStop: request.nonStop === true,
    max: Math.min(Math.max(Number(request.max) || 6, 1), 20),
  });
  const offers = (response?.data || []).map(mapOffer);
  const totals = offers.map((offer) => offer.total).filter((value) => value > 0);
  return {
    ok: true,
    offers,
    dictionaries: response?.dictionaries || {},
    priceSummary: totals.length ? { from: Math.min(...totals), currency: offers[0]?.currency || request.currency || 'SEK' } : null,
  };
});
