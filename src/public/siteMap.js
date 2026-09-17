// src/public/siteMap.js
// SKANDI canonical route + global chrome/auth-popup registry — B-011.29
// Single source of truth for public/internal routes and global header/footer embeds.


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
  opsControl: "/riaintra/success-factors/altea/occ",
  inventoryControl: "/riaintra/altea/inventory-control",
  uniformCenter: "/riaintra/uniform",
  uniformControl: "/riaintra/altea/uniform-control",
  uniformRegulations: "/riaintra/uniform-regulations",
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


// Canonical customer-auth popup registry for PAGE-LEVEL customer actions.
// The global SKANDI header remains owned by masterPage.js and is intentionally
// not routed through these page-level popups. Wix opens popups by popup name.
export const CUSTOMER_AUTH_POPUPS = Object.freeze({
  login: Object.freeze({
    name: "Log In Form (Popup)",
    codeFile: "Log In Form (Popup).bytg4.js"
  }),
  resetPassword: Object.freeze({
    name: "Reset Password (Popup)",
    codeFile: "Reset Password (Popup).rygmm.js"
  })
});


// B-011 global-chrome file registry. These paths identify the canonical source
// files in the Drive workspace. Wix element IDs are kept here so masterPage.js
// does not maintain a second header/footer map.
export const GLOBAL_CHROME = Object.freeze({
  customerHeader: Object.freeze({
    system: "SKANDI",
    role: "HEADER",
    file: "/embed/SKANDI-Global-Header.html",
    source: "SKANDI_CUSTOMER_HEADER_EXPANDBAR",
    elementIds: Object.freeze(["#skandiHeaderEmbed", "#skandiCustomerHeaderEmbed"]),
    collapsedHeight: 118,
    maxHeight: 1200
  }),
  customerFooter: Object.freeze({
    system: "SKANDI",
    role: "FOOTER",
    file: "/embed/SKANDI-Global-Footer.html",
    source: "SKANDI_CUSTOMER_FOOTER",
    elementIds: Object.freeze(["#skandiFooterEmbed", "#skandiCustomerFooterEmbed"]),
    collapsedHeight: 0,
    maxHeight: 2400
  }),
  riaintraHeader: Object.freeze({
    system: "RIAINTRA",
    role: "HEADER",
    file: "/embed/RIAINTRA-Global-Header.html",
    source: "SKANDI_RIAINTRA_HEADER",
    elementIds: Object.freeze(["#riaintraHeaderEmbed", "#riaintraHeader", "#staffInternalChromeEmbed"]),
    collapsedHeight: 52,
    maxHeight: 700
  }),
  alteaHeader: Object.freeze({
    system: "ALTEA",
    role: "HEADER",
    file: "/embed/ALTEA-Global-Header.html",
    source: "SKANDI_ALTEA_HEADER",
    elementIds: Object.freeze(["#alteaHeaderEmbed", "#alteaHeader"]),
    collapsedHeight: 48,
    maxHeight: 300
  }),
  alteaFooter: Object.freeze({
    system: "ALTEA",
    role: "FOOTER",
    file: "/embed/ALTEA-Global-Footer.html",
    source: "SKANDI_ALTEA_FOOTER",
    elementIds: Object.freeze(["#alteaFooterEmbed", "#alteaFooter"]),
    collapsedHeight: 30,
    maxHeight: 120
  })
});


export const ROUTE_META = Object.freeze({
  alteaTimatic: Object.freeze({ deprecated: true, removal: "planned", note: "Keep route until the Timatic page is formally retired." })
});


export function getSiteRoute(key) {
  if (Object.prototype.hasOwnProperty.call(SITE_MAP, key)) return SITE_MAP[key];
  return Object.prototype.hasOwnProperty.call(APP_ROUTES, key) ? APP_ROUTES[key] : "";
}


export function getGlobalChrome(key) {
  return Object.prototype.hasOwnProperty.call(GLOBAL_CHROME, key) ? GLOBAL_CHROME[key] : null;
}


export function getCustomerAuthPopup(key) {
  return Object.prototype.hasOwnProperty.call(CUSTOMER_AUTH_POPUPS, key) ? CUSTOMER_AUTH_POPUPS[key] : null;
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
