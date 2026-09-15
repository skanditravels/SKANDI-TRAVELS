// src/public/siteMap.js
// SKANDI canonical route registry — B-011
// This is the single source of truth for public/global route names used by Wix page code.


export const SITE_MAP = Object.freeze({
  home: "/",
  search: "/search",
  flights: "/flights",
  carRental: "/car-rental",
  hotels: "/hotels",
  packages: "/packages",
  tours: "/tours",
  activities: "/activities",
  transfers: "/transfers",
  destinations: "/destinations",
  offers: "/offers",
  travelInfo: "/travel-info",
  skandiCollection: "/skandi-collection",
  voy: "/voy-magazine",
  club: "/skandi-club",
  about: "/about",
  support: "/about/support",
  newsroom: "/about/news-room",
  theStore: "/the-store",
  storeCheckout: "/the-store/store-checkout",
  storeConfirmation: "/the-store/store-checkout/order-confirmation",
  ourNetwork: "/about/our-network",
  legal: "/about/legal",
  policies: "/about/legal/policies",
  riaintra: "/riaintra",
  staffLogin: "/riaintra",
  successFactors: "/riaintra/success-factors",
  alteaLaunchpad: "/riaintra/success-factors/altea",
  alteaReservations: "/riaintra/success-factors/altea/reservations",
  inventoryControl: "/riaintra/altea/inventory-control",
  alteaTimatic: "/riaintra/success-factors/altea/timatic",
  mail: "/riaintra/success-factors/mail",
  docunet: "/riaintra/success-factors/docunet",
  serviceDesk: "/riaintra/success-factors/helpdesk",
  mediaControl: "/riaintra/success-factors/media-control",
  magazineManager: "/riaintra/success-factors/magazine-manager",
  storeControl: "/riaintra/success-factors/store-control",
  payroll: "/riaintra/success-factors/payroll"
});


// Valid application routes that are not top-level site-map destinations.
export const APP_ROUTES = Object.freeze({
  bookingFlow: "/booking",
  myProfile: "/my-profile",
  myTrips: "/my-profile?tab=trips",
  careers: "/about/careers",
  myRoster: "/riaintra/success-factors/my-roster",
  groupTalk: "/riaintra/success-factors/altea/grouptalk",
  passportVisa: "/travel-info/passport-visa",
  baggageAllowance: "/travel-info/baggage-allowence",
  travelInsurance: "/travel-info/insurance",
  specialAssistance: "/travel-info/special-assistance",
  flightStatus: "/travel-info/flight-status"
});


export const ROUTE_META = Object.freeze({
  alteaTimatic: Object.freeze({ deprecated: true, removal: "planned", note: "Keep route until the Timatic page is formally retired." })
});


export function getSiteRoute(key) {
  if (Object.prototype.hasOwnProperty.call(SITE_MAP, key)) return SITE_MAP[key];
  return Object.prototype.hasOwnProperty.call(APP_ROUTES, key) ? APP_ROUTES[key] : "";
}


export function isSafeInternalRoute(value) {
  const path = String(value || "").trim();
  const invalid = input => /[\\\x00-\x1F\x7F]/.test(input);
  if (!path.startsWith("/") || path.startsWith("//") || invalid(path)) return false;
  try {
    const decoded = decodeURIComponent(path.split(/[?#]/, 1)[0]);
    return decoded.startsWith("/") && !decoded.startsWith("//") && !invalid(decoded);
  } catch (_) { return false; }
}
