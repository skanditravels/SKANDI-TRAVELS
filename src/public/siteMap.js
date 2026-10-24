// src/public/siteMap.js
// SKANDI canonical route + global chrome/auth-popup registry — B-011.29 / V12 editorial catalog extension.
// Single source of truth for public/internal routes, global chrome and Media Control page/section registration.

export const SITE_MAP = Object.freeze({
  home: "/", search: "/search", flights: "/flights", carRental: "/car-rental",
  hotels: "/hotels", packages: "/packages", cruises: "/cruises", tours: "/tours",
  activities: "/activities", transfers: "/transfers", destinations: "/destinations",
  offers: "/offers", travelInfo: "/travel-info", skandiCollection: "/skandi-collection",
  voy: "/voy-magazine", club: "/skandi-club", forgotPassword: "/forgot-password",
  about: "/about", support: "/about/support", newsroom: "/about/news-room",
  theStore: "/the-store", giftCard: "/gift-card", storeCheckout: "/the-store/store-checkout",
  storeConfirmation: "/the-store/store-checkout/order-confirmation", ourNetwork: "/about/our-network",
  legal: "/about/legal", policies: "/about/legal/policies", cookiePreferences: "/about/legal/cookie-preferences", riaintra: "/riaintra",
  staffLogin: "/riaintra", successFactors: "/riaintra/success-factors",
  legalInternal: "/riaintra/success-factors/legal-internal", alteaLaunchpad: "/riaintra/success-factors/altea",
  alteaReservations: "/riaintra/success-factors/altea/reservations", opsControl: "/riaintra/success-factors/altea/ops",
  inventoryControl: "/riaintra/success-factors/altea/inventory-control", uniformCenter: "/riaintra/success-factors/uniform",
  uniformControl: "/riaintra/success-factors/uniform/admin-control", alteaTimatic: "/riaintra/success-factors/altea/timatic",
  mail: "/riaintra/success-factors/mail", docunet: "/riaintra/success-factors/docunet",
  docunetAdmin: "/riaintra/success-factors/docunet/admin", serviceDesk: "/riaintra/success-factors/service-desk", policyControl: "/riaintra/success-factors/policy-control",
  mediaControl: "/riaintra/success-factors/media-control", storeControl: "/riaintra/success-factors/store-control",
  payroll: "/riaintra/success-factors/payroll"
});

export const APP_ROUTES = Object.freeze({
  country: "/destinations/country", bookingFlow: "/booking", myProfile: "/my-profile",
  myTrips: "/my-profile?tab=trips", careers: "/about/careers",
  myRoster: "/riaintra/success-factors/my-roster", groupTalk: "/riaintra/success-factors/altea/grouptalk",
  passportVisa: "/travel-info/passport-visa", baggageAllowance: "/travel-info/baggage-allowance",
  travelInsurance: "/travel-info/insurance", specialAssistance: "/travel-info/special-assistance",
  flightStatus: "/travel-info/flight-status"
});

const field = (id, label, type = "TEXT") => Object.freeze({ id, label, type });
const section = (id, label, fields = [], mediaSlots = []) => Object.freeze({
  id, label, fields: Object.freeze(fields), mediaSlots: Object.freeze(mediaSlots)
});
const page = (key, label, path, authority, sections = [], options = {}) => Object.freeze({
  key, label, path, authority, editorial: sections.length > 0, pagePlan: true,
  presentationRuntime: options.presentationRuntime === true,
  sections: Object.freeze(sections)
});

// Media Control catalog. Route paths always reference SITE_MAP / APP_ROUTES rather than repeating route authority.
// Only static Presentation Registry hooks are exposed as editable fields. Inventory, legal-policy bodies,
// commerce data, bookings, customer data and provider-owned facts remain with their existing owners.
export const EDITORIAL_PAGE_CATALOG = Object.freeze([
  page("home", "Home", SITE_MAP.home, "PUBLIC_PRESENTATION"),
  page("search", "Search", SITE_MAP.search, "PUBLIC_PRESENTATION", [
    section("search-hero", "Search hero", [field("search-hero-eyebrow","Eyebrow"),field("search-hero-h1","Headline"),field("search-hero-copy","Intro copy","LONG_TEXT")])
  ]),
  page("flights", "Flights", SITE_MAP.flights, "OPERATIONAL"),
  page("carRental", "Car Rental", SITE_MAP.carRental, "PUBLIC_PRESENTATION", [
    section("car-rental-hero","Hero",[field("car-rental-hero-eyebrow","Eyebrow"),field("car-rental-hero-h1","Headline"),field("car-rental-hero-copy","Hero copy","LONG_TEXT")]),
    section("car-rental-search","Reservation desk",[field("car-rental-search-h2","Reservation headline"),field("car-rental-search-copy","Reservation copy","LONG_TEXT")]),
    section("car-rental-fleet","Fleet editorial",[field("car-rental-fleet-eyebrow","Eyebrow"),field("car-rental-fleet-h2","Headline"),field("car-rental-fleet-copy","Copy","LONG_TEXT")])
  ]),
  page("hotels", "Hotels", SITE_MAP.hotels, "OPERATIONAL"),
  page("packages", "Packages", SITE_MAP.packages, "OPERATIONAL"),
  page("cruises", "Cruises", SITE_MAP.cruises, "OPERATIONAL"),
  page("tours", "Tours & Activities", SITE_MAP.tours, "OPERATIONAL"),
  page("activities", "Activities", SITE_MAP.activities, "OPERATIONAL"),
  page("transfers", "Transfers", SITE_MAP.transfers, "OPERATIONAL"),
  page("destinations", "Destinations", SITE_MAP.destinations, "INVENTORY"),
  page("country", "Destination country", APP_ROUTES.country, "INVENTORY"),
  page("offers", "Offers", SITE_MAP.offers, "INVENTORY"),
  page("travelInfo", "Travel Info", SITE_MAP.travelInfo, "INVENTORY"),
  page("passportVisa", "Passport & Visa", APP_ROUTES.passportVisa, "PUBLIC_PRESENTATION", [
    section("passport-hero","Hero",[field("passport-hero-kicker","Kicker"),field("passport-hero-title","Headline"),field("passport-hero-copy","Hero copy","LONG_TEXT")])
  ]),
  page("baggageAllowance", "Baggage Allowance", APP_ROUTES.baggageAllowance, "INVENTORY"),
  page("travelInsurance", "Travel Insurance", APP_ROUTES.travelInsurance, "PUBLIC_PRESENTATION", [
    section("insurance-hero","Hero",[field("insurance-hero-kicker","Kicker"),field("insurance-hero-title","Headline"),field("insurance-hero-copy","Hero copy","LONG_TEXT")])
  ]),
  page("specialAssistance", "Special Assistance", APP_ROUTES.specialAssistance, "PUBLIC_CONTENT"),
  page("flightStatus", "Flight Status", APP_ROUTES.flightStatus, "OPERATIONAL"),
  page("skandiCollection", "SKANDI Collection", SITE_MAP.skandiCollection, "INVENTORY"),
  page("voy", "VOY Magazine", SITE_MAP.voy, "VOY", [], { presentationRuntime:true }),
  page("forgotPassword", "Forgot Password", SITE_MAP.forgotPassword, "CUSTOMER_AUTH"),
  page("bookingFlow", "Booking Flow", APP_ROUTES.bookingFlow, "BOOKING"),
  page("myProfile", "My Profile", APP_ROUTES.myProfile, "CUSTOMER_PROFILE"),
  page("myTrips", "My Trips", APP_ROUTES.myTrips, "CUSTOMER_PROFILE"),
  page("club", "SKANDI Club", SITE_MAP.club, "PUBLIC_PRESENTATION", [
    section("club-hero","Hero",[field("club-hero-eyebrow","Eyebrow"),field("club-hero-h1","Headline"),field("club-hero-copy","Hero copy","LONG_TEXT")]),
    section("club-tiers","Club levels",[field("club-tiers-eyebrow","Eyebrow"),field("club-tiers-h2","Headline"),field("club-tiers-copy","Copy","LONG_TEXT")]),
    section("club-benefits","Benefits",[field("club-benefits-eyebrow","Eyebrow"),field("club-benefits-h2","Headline"),field("club-benefits-copy","Copy","LONG_TEXT")]),
    section("club-rewards","Rewards",[field("club-rewards-eyebrow","Eyebrow"),field("club-rewards-h2","Headline"),field("club-rewards-copy","Copy","LONG_TEXT")]),
    section("club-faq","FAQ",[field("club-faq-eyebrow","Eyebrow"),field("club-faq-h2","Headline")]),
    section("club-cta","Final CTA",[field("club-cta-h2","Headline"),field("club-cta-copy","Copy","LONG_TEXT")])
  ]),
  page("about", "About SKANDI", SITE_MAP.about, "PUBLIC_PRESENTATION", [
    section("about-hero","Hero",[field("about-hero-eyebrow","Eyebrow"),field("about-hero-h1","Headline"),field("about-hero-copy","Hero copy","LONG_TEXT")]),
    section("about-who","Who we are",[field("about-who-eyebrow","Eyebrow"),field("about-who-h2","Headline"),field("about-who-copy","Copy","LONG_TEXT"),field("about-who-charter-title","Charter title"),field("about-who-charter-copy","Charter copy","LONG_TEXT"),field("about-who-charter-action","Charter action"),field("about-who-elevated-title","Elevated title"),field("about-who-elevated-copy","Elevated copy","LONG_TEXT"),field("about-who-elevated-action","Elevated action"),field("about-who-global-title","Global title"),field("about-who-global-copy","Global copy","LONG_TEXT"),field("about-who-global-action","Global action")]),
    section("about-story","Our story",[field("about-story-eyebrow","Eyebrow"),field("about-story-h2","Headline"),field("about-story-copy","Story copy","LONG_TEXT")]),
    section("about-collection","SKANDI Collection",[field("about-collection-eyebrow","Eyebrow"),field("about-collection-h2","Headline")]),
    section("about-focus","Selected focus",[field("about-focus-eyebrow","Eyebrow"),field("about-focus-h2","Headline"),field("about-focus-copy","Copy","LONG_TEXT")]),
    section("about-links","Helpful links",[field("about-links-eyebrow","Eyebrow"),field("about-links-h2","Headline"),field("about-links-copy","Copy","LONG_TEXT"),field("about-links-careers-title","Careers title"),field("about-links-careers-copy","Careers copy","LONG_TEXT"),field("about-links-careers-action","Careers action"),field("about-links-newsroom-title","Newsroom title"),field("about-links-newsroom-copy","Newsroom copy","LONG_TEXT"),field("about-links-newsroom-action","Newsroom action"),field("about-links-legal-title","Legal title"),field("about-links-legal-copy","Legal copy","LONG_TEXT"),field("about-links-legal-action","Legal action"),field("about-links-travel-info-title","Travel Info title"),field("about-links-travel-info-copy","Travel Info copy","LONG_TEXT"),field("about-links-travel-info-action","Travel Info action")]),
    section("about-cta","Final CTA",[field("about-cta-h2","Headline"),field("about-cta-copy","Copy","LONG_TEXT"),field("about-cta-collection-button","Collection button"),field("about-cta-club-button","Club button")])
  ]),
  page("support", "Help Center", SITE_MAP.support, "PUBLIC_PRESENTATION", [
    section("support-hero","Hero",[field("support-hero-eyebrow","Eyebrow"),field("support-hero-h1","Headline"),field("support-hero-copy","Hero copy","LONG_TEXT")]),
    section("support-popular-topics","Popular topics",[field("support-popular-eyebrow","Eyebrow"),field("support-popular-h3","Headline"),field("support-popular-copy","Copy","LONG_TEXT")]),
    section("support-channels","Support channels",[field("support-channels-eyebrow","Eyebrow"),field("support-channels-h3","Headline")]),
    section("support-club","Club support",[field("support-club-eyebrow","Eyebrow"),field("support-club-h3","Headline"),field("support-club-copy","Copy","LONG_TEXT")]),
    section("support-form","Support form",[field("support-form-eyebrow","Eyebrow"),field("support-form-h2","Headline"),field("support-form-copy","Copy","LONG_TEXT")])
  ]),
  page("newsroom", "Newsroom", SITE_MAP.newsroom, "NEWSROOM", [
    section("newsroom-intro","Newsroom intro",[field("newsroom-eyebrow","Eyebrow"),field("newsroom-h1","Headline"),field("newsroom-copy","Intro copy","LONG_TEXT")]),
    section("newsroom-featured","Featured release",[],[Object.freeze({id:"newsroom-featured",label:"Featured release media"})]),
    section("newsroom-media-library","Media Library",[field("newsroom-media-eyebrow","Eyebrow"),field("newsroom-media-h2","Headline"),field("newsroom-media-copy","Copy","LONG_TEXT")]),
    section("newsroom-contacts","Media contacts",[field("newsroom-contacts-eyebrow","Eyebrow"),field("newsroom-contacts-h2","Headline"),field("newsroom-contacts-copy","Copy","LONG_TEXT")]),
    section("newsroom-subscribe","Subscribe",[field("newsroom-subscribe-eyebrow","Eyebrow"),field("newsroom-subscribe-h2","Headline"),field("newsroom-subscribe-copy","Copy","LONG_TEXT")])
  ], { presentationRuntime:true }),
  page("careers", "Careers", APP_ROUTES.careers, "CAREERS"),
  page("ourNetwork", "Our Network", SITE_MAP.ourNetwork, "INVENTORY"),
  page("legal", "Legal", SITE_MAP.legal, "PUBLIC_PRESENTATION", [
    section("legal-hero","Hero",[field("legal-hero-eyebrow","Eyebrow"),field("legal-hero-h1","Headline"),field("legal-hero-copy","Hero copy","LONG_TEXT")]),
    section("legal-featured","Featured documents",[field("legal-featured-eyebrow","Eyebrow"),field("legal-featured-h2","Headline"),field("legal-featured-copy","Copy","LONG_TEXT")]),
    section("legal-library","Policy library",[field("legal-library-eyebrow","Eyebrow"),field("legal-library-h2","Headline"),field("legal-library-copy","Copy","LONG_TEXT")])
  ]),
  page("policies", "Policy Document", SITE_MAP.policies, "POLICY_CONTROL", [
    section("policy-toc","Table of contents",[field("policy-toc-eyebrow","Eyebrow"),field("policy-toc-h2","Headline")]),
    section("policy-suggested","Suggested documents",[field("policy-suggested-eyebrow","Eyebrow"),field("policy-suggested-h2","Headline")]),
    section("policy-acknowledgement","Acknowledgement",[field("policy-acknowledgement-eyebrow","Eyebrow"),field("policy-acknowledgement-h2","Headline"),field("policy-acknowledgement-copy","Copy","LONG_TEXT")]),
    section("policy-document-head","Document header",[field("policy-document-eyebrow","Eyebrow")])
  ]),
  page("cookiePreferences", "Cookie Preferences", SITE_MAP.cookiePreferences, "CONSENT_POLICY"),
  page("theStore", "The Store", SITE_MAP.theStore, "STORE", [
    section("store-hero","Store hero",[field("store-hero-eyebrow","Eyebrow"),field("store-hero-h1","Headline"),field("store-hero-copy","Hero copy","LONG_TEXT")])
  ]),
  page("giftCard", "Gift Card", SITE_MAP.giftCard, "WIX_GIFT_CARDS"),
  page("storeCheckout", "Store Checkout", SITE_MAP.storeCheckout, "STORE"),
  page("storeConfirmation", "Store Order Confirmation", SITE_MAP.storeConfirmation, "STORE")
]);

export const CUSTOMER_AUTH_POPUPS = Object.freeze({
  signUp: Object.freeze({ name:"Become SKANDI Club Member", codeFile:"Become SKANDI Club Member.o4qut.js" }),
  logIn: Object.freeze({ name:"SKANDI Club Log In", codeFile:"SKANDI Club Log In.bytg4.js" }),
  resetPassword: Object.freeze({ name:"Reset Password (Popup)", codeFile:"Reset Password (Popup).rygmm.js" })
});

export const GLOBAL_CHROME = Object.freeze({
  customerHeader:Object.freeze({system:"SKANDI",role:"HEADER",file:"/embed/SKANDI-Global-Header.html",source:"SKANDI_CUSTOMER_HEADER_EXPANDBAR",elementIds:Object.freeze(["#skandiHeaderEmbed","#skandiCustomerHeaderEmbed"]),collapsedHeight:118,maxHeight:118}),
  customerFooter:Object.freeze({system:"SKANDI",role:"FOOTER",file:"/embed/SKANDI-Global-Footer.html",source:"SKANDI_CUSTOMER_FOOTER",elementIds:Object.freeze(["#skandiFooterEmbed","#skandiCustomerFooterEmbed"]),collapsedHeight:0,maxHeight:2400}),
  cookieBanner:Object.freeze({system:"SKANDI",role:"CONSENT",file:"/embed/SKANDI-Cookie-Banner.html",source:"SKANDI_COOKIE_BANNER",elementIds:Object.freeze(["#skandiCookieBannerEmbed"]),collapsedHeight:1,maxHeight:560}),
  riaintraHeader:Object.freeze({system:"RIAINTRA",role:"HEADER",file:"/embed/RIAINTRA-Global-Header.html",source:"SKANDI_RIAINTRA_HEADER",elementIds:Object.freeze(["#riaintraHeaderEmbed","#riaintraHeader","#staffInternalChromeEmbed"]),collapsedHeight:52,maxHeight:700}),
  riaintraFooter:Object.freeze({system:"RIAINTRA",role:"FOOTER",file:"/embed/RIAINTRA-Global-Footer.html",source:"SKANDI_RIAINTRA_FOOTER",elementIds:Object.freeze(["#riaintraFooterEmbed","#riaintraFooter"]),collapsedHeight:0,maxHeight:180}),
  alteaHeader:Object.freeze({system:"ALTEA",role:"HEADER",file:"/embed/ALTEA-Global-Header.html",source:"SKANDI_ALTEA_HEADER",elementIds:Object.freeze(["#alteaHeaderEmbed","#alteaHeader"]),collapsedHeight:48,maxHeight:300}),
  alteaFooter:Object.freeze({system:"ALTEA",role:"FOOTER",file:"/embed/ALTEA-Global-Footer.html",source:"SKANDI_ALTEA_FOOTER",elementIds:Object.freeze(["#alteaFooterEmbed","#alteaFooter"]),collapsedHeight:30,maxHeight:120})
});

export const ROUTE_META = Object.freeze({ alteaTimatic:Object.freeze({deprecated:true,removal:"planned",note:"Keep route until the Timatic page is formally retired."}) });
export function getSiteRoute(key){if(Object.prototype.hasOwnProperty.call(SITE_MAP,key))return SITE_MAP[key];return Object.prototype.hasOwnProperty.call(APP_ROUTES,key)?APP_ROUTES[key]:""}
export function getGlobalChrome(key){return Object.prototype.hasOwnProperty.call(GLOBAL_CHROME,key)?GLOBAL_CHROME[key]:null}
export function getCustomerAuthPopup(key){return Object.prototype.hasOwnProperty.call(CUSTOMER_AUTH_POPUPS,key)?CUSTOMER_AUTH_POPUPS[key]:null}
export function getEditorialPageCatalog(){return EDITORIAL_PAGE_CATALOG}
export function isSafeInternalRoute(value){const path=String(value||"").trim();const invalid=input=>/[\\\x00-\x1F\x7F]/.test(input);if(!path.startsWith("/")||path.startsWith("//")||invalid(path))return false;try{const decoded=decodeURIComponent(path.split(/[?#]/,1)[0]);return decoded.startsWith("/")&&!decoded.startsWith("//")&&!invalid(decoded)}catch(_){return false}}

// Compiler integration bindings. No route strings are duplicated here.
// Source-verified controller contracts; Wix element installation still requires live verification.
export const PAGE_BUILD_INTEGRATIONS = Object.freeze({
  "destinations": {
    "controller": "src/pages/Our Destinations.wfe5g.js",
    "embedIds": ["#htmlSkandiMap"],
    "sources": ["SKANDI_PUBLIC_NETWORK_MAP"]
  },
  "cookiePreferences": {
    "controller": "src/pages/masterPage.js",
    "embedIds": ["#cookiePreferencesEmbed"],
    "sources": ["SKANDI_COOKIE_PREFERENCES"]
  },
  "specialAssistance": {
    "controller": "src/pages/masterPage.js",
    "embedIds": [],
    "sources": ["SKANDI_ASSISTANCE_PAGE"],
    "binding": "handshake"
  },
  "home": {
    "controller": "src/pages/Home.n73w8.js",
    "embedIds": [
      "#htmlHome",
      "#htmlhome",
      "#home"
    ],
    "sources": [
      "SKANDI_HOME",
      "SKANDI_HOME_LONG_DISCOVERY_V2",
      "SKANDI_HOME_OLD_STYLE"
    ]
  },
  "search": {
    "controller": "src/pages/Search.b7zch.js",
    "embedIds": [
      "#searchResultsEmbed"
    ],
    "sources": [
      "SKANDI_SEARCH_RESULTS"
    ]
  },
  "carRental": {
    "controller": "src/pages/Car Rental.i9rnb.js",
    "embedIds": [
      "#carRentalEmbed"
    ],
    "sources": [
      "SKANDI_CAR_RENTAL"
    ]
  },
  "country": {
    "controller": "src/pages/Country.nxtpn.js",
    "embedIds": [],
    "sources": [
      "SKANDI_DYNAMIC_COUNTRY_PAGE"
    ],
    "binding": "handshake"
  },
  "flightStatus": {
    "controller": "src/pages/Flight Status.cn7ah.js",
    "embedIds": [
      "#flightStatusEmbed"
    ],
    "sources": [
      "SKANDI_FLIGHT_STATUS"
    ],
    "stem": "flight-status"
  },
  "riaintra": {
    "controller": "src/pages/RIAINTRA.rc14z.js",
    "embedIds": [
      "#staffLoginEmbed"
    ],
    "sources": [
      "SKANDI_STAFF_LOGIN"
    ],
    "sourceDirectory": "riaintra-embeds/riaintra",
    "stem": "riaintra",
    "publicEntry": true
  },
  "successFactors": {
    "controller": "src/pages/Success Factors.sh6tw.js",
    "sourceDirectory": "riaintra-embeds/success-factors",
    "stem": "success-factors",
    "embedIds": [
      "#staffHrEmbed"
    ],
    "sources": []
  },
  "alteaLaunchpad": {
    "controller": "src/pages/ALTEA Launchpad.ajs4y.js",
    "embedIds": [],
    "sources": [
      "SKANDI_ALTEA_LAUNCHPAD"
    ],
    "binding": "handshake"
  },
  "alteaReservations": {
    "controller": "src/pages/Reservations.ly2n8.js",
    "embedIds": [
      "#alteaReservationsEmbed"
    ],
    "sources": [
      "SKANDI_DUFFEL_RESERVATIONS"
    ]
  },
  "opsControl": {
    "controller": "src/pages/OPS Control.uposx.js",
    "embedIds": [
      "#opsControlEmbed",
      "#htmlOpsControl",
      "#occEmbed"
    ],
    "sources": [
      "SKANDI_OPS_CONTROL"
    ]
  },
  "inventoryControl": {
    "controller": "src/pages/Inventory Control.jsdik.js",
    "embedIds": [
      "#inventoryControlEmbed"
    ],
    "sources": [
      "SKANDI_INVENTORY_EMBED"
    ]
  },
  "groupTalk": {
    "controller": "src/pages/GroupTalk.wi4iw.js",
    "embedIds": [
      "#htmlGroupTalk"
    ],
    "sources": [
      "GROUPTALK_HTML"
    ]
  },
  "uniformCenter": {
    "controller": "src/pages/Uniform Center.lukfc.js",
    "embedIds": [
      "#uniformCenterEmbed"
    ],
    "sources": [
      "SKANDI_UNIFORM_EMPLOYEE"
    ]
  },
  "uniformControl": {
    "controller": "src/pages/Uniform Control.yx92b.js",
    "embedIds": [
      "#uniformControlEmbed"
    ],
    "sources": []
  },
  "mail": {
    "controller": "src/pages/Mail.ecik8.js",
    "embedIds": [
      "#mailEmbed"
    ],
    "sources": [
      "SKANDI_MAIL_EMBED"
    ]
  },
  "docunet": {
    "controller": "src/pages/DocuNet.twh13.js",
    "embedIds": [
      "#docuNetViewerEmbed"
    ],
    "sources": []
  },
  "docunetAdmin": {
    "controller": "src/pages/DocuNet Administration.u5a64.js",
    "embedIds": [
      "#docuNetAdminEmbed"
    ],
    "sources": [
      "SKANDI_DOCUNET_ADMIN"
    ]
  },
  "policyControl": {
    "controller": "src/pages/Policy Control.ec9p4.js",
    "embedIds": [
      "#policyControlEmbed"
    ],
    "sources": []
  },
  "mediaControl": {
    "controller": "src/pages/Media Control.chm91.js",
    "embedIds": [
      "#mediaControlEmbed"
    ],
    "sources": []
  },
  "storeControl": {
    "controller": "src/pages/The Store Control.y10le.js",
    "embedIds": [
      "#storeControlEmbed"
    ],
    "sources": [
      "SKANDI_STORE_CONTROL_V3"
    ]
  },
  "payroll": {
    "controller": "src/pages/Payroll.rzo0a.js",
    "embedIds": [
      "#payrollStaffEmbed"
    ],
    "sources": []
  },
  "myRoster": {
    "controller": "src/pages/MyRoster.l8p5m.js",
    "embedIds": [
      "#myRosterEmbed"
    ],
    "sources": [
      "SKANDI_MYROSTER_EMBED"
    ],
    "note": "Existing controller imports backend/FINAL/internalChrome.web.js, which is absent. Preserve existing behavior; integration remains blocked."
  },
  "legalInternal": {
    "controller": "src/pages/RIAINTRA Legal.xvi17.js",
    "embedIds": [
      "#internalLegalHubEmbed"
    ],
    "sources": []
  },
  "about": {
    "controller": "src/pages/About.xcftf.js",
    "embedIds": [
      "#aboutEmbed"
    ],
    "sources": [
      "SKANDI_ABOUT_PAGE"
    ]
  },
  "club": {
    "controller": "src/pages/SKANDI Signature Club.gsejz.js",
    "embedIds": [
      "#skandiClubInfoEmbed"
    ],
    "sources": [
      "SKANDI_CLUB_INFO"
    ]
  },
  "forgotPassword": {
    "controller": "src/pages/Forgot Password.uagf0.js",
    "embedIds": [
      "#forgotPasswordHtml"
    ],
    "sources": [
      "SKANDI_FORGOT_PASSWORD"
    ]
  },
  "myProfile": {
    "controller": "src/pages/My Club Profile.u4k31.js",
    "embedIds": [
      "#htmlMyProfile"
    ],
    "sources": [
      "SKANDI_MY_PROFILE"
    ]
  },
  "newsroom": {
    "controller": "src/pages/News Room.vn46g.js",
    "embedIds": [
      "#newsroomEmbed"
    ],
    "sources": [
      "SKANDI_PUBLIC_NEWSROOM"
    ]
  },
  "voy": {
    "controller": "src/pages/VOY Magazine.gecp7.js",
    "embedIds": [
      "#voyMagazineEmbed"
    ],
    "sources": []
  },
  "careers": {
    "controller": "src/pages/Work at SKANDI.dyodg.js",
    "embedIds": [
      "#careersEmbed"
    ],
    "sources": [
      "SKANDI_CAREERS_HUB"
    ]
  },
  "legal": {
    "controller": "src/pages/Legal.nvnld.js",
    "embedIds": [
      "#legalHubEmbed"
    ],
    "sources": [
      "SKANDI_LEGAL_HUB"
    ]
  },
  "policies": {
    "controller": "src/pages/Policies.sgcey.js",
    "embedIds": [
      "#legalPolicyEmbed"
    ],
    "sources": [
      "SKANDI_LEGAL_DOCUMENT"
    ]
  },
  "passportVisa": {
    "controller": "src/pages/Passport & Visa.zohjw.js",
    "embedIds": [
      "#passportVisaEmbed"
    ],
    "sources": [
      "SKANDI_PASSPORT_VISA_PAGE"
    ]
  },
  "baggageAllowance": {
    "controller": "src/pages/Baggage Allowance.tf8xc.js",
    "embedIds": [
      "#baggageInfoEmbed"
    ],
    "sources": [
      "SKANDI_BAGGAGE_PAGE"
    ]
  },
  "travelInsurance": {
    "controller": "src/pages/Insurance.ojo62.js",
    "embedIds": [
      "#travelInsuranceEmbed"
    ],
    "sources": [
      "SKANDI_INSURANCE_PAGE"
    ]
  },
  "travelInfo": {
    "controller": "src/pages/Travel Info.m43d6.js",
    "embedIds": [
      "#travelInfoHtml",
      "#travelInfoEmbed",
      "#html1"
    ],
    "sources": [
      "SKANDI_PUBLIC_TRAVEL_INFO"
    ]
  },
  "skandiCollection": {
    "controller": "src/pages/SKANDI Collection.lo9p5.js",
    "embedIds": [
      "#skandiCollectionEmbed",
      "#signatureCollectionEmbed",
      "#skandiCollectionHtml",
      "#signatureCollectionHtml",
      "#html1"
    ],
    "sources": [
      "SKANDI_SIGNATURE_COLLECTION"
    ]
  },
  "tours": {
    "controller": "src/pages/Tours & Activities.jxipw.js",
    "embedIds": [
      "#toursActivitiesHtml"
    ],
    "sources": [
      "SKANDI_TOURS_ACTIVITIES"
    ]
  },
  "theStore": {
    "controller": "src/pages/The Store.iv8g6.js",
    "embedIds": [
      "#skandiStoreEmbed"
    ],
    "sources": [
      "SKANDI_STOREFRONT"
    ]
  },
  "storeCheckout": {
    "controller": "src/pages/Checkout.qofcb.js",
    "embedIds": [
      "#storeCheckoutEmbed"
    ],
    "sources": [
      "SKANDI_STORE_CHECKOUT"
    ]
  },
  "storeConfirmation": {
    "controller": "src/pages/Order Confirmation.u5zzl.js",
    "embedIds": [
      "#storeOrderConfirmationEmbed"
    ],
    "sources": [
      "SKANDI_STORE_CONFIRMATION"
    ]
  },
  "bookingFlow": {
    "controller": "src/pages/Booking.e8twe.js",
    "embedIds": [
      "#bookingOfferEmbed",
      "#bookingExtrasEmbed",
      "#signatureTransferEmbed",
      "#apisHtml",
      "#seatmapEmbed",
      "#paymentEmbed",
      "#confirmationEmbed",
      "#bookingDocumentsEmbed"
    ],
    "sources": [],
    "binding": "multi-component",
    "note": "Retain the eight-step Wix state/HTML components. A single receiver requires a separately verified controller migration."
  },
  "support": {
    "controller": "src/pages/How can we help_.k0iqp.js",
    "embedIds": [
      "#skandiHelpCenterEmbed",
      "#skandiSupportChatEmbed"
    ],
    "sources": [
      "HELP_CENTER",
      "help-center",
      "SKANDI_SUPPORT_PUBLIC"
    ],
    "binding": "multi-component",
    "note": "Help Center and support chat are separate HTML components; preserve them until a verified single-component migration."
  }
});

// These rules were moved unchanged from masterPage.js so compilation and Wix agree.
export const INTERNAL_PATH_PREFIXES = Object.freeze(["/riaintra", "/altea", "/_functions"]);
export const ALTEA_PATH_PREFIXES = Object.freeze([SITE_MAP.alteaLaunchpad, "/riaintra/altea", "/altea"]);
export const CHROME_FREE_PATHS = Object.freeze([
  APP_ROUTES.groupTalk, SITE_MAP.riaintra, APP_ROUTES.bookingFlow,
  SITE_MAP.storeConfirmation, SITE_MAP.storeCheckout, SITE_MAP.theStore
]);
export function normalizeSitePath(value = "") {
  return String(value || "").toLowerCase().split(/[?#]/)[0].replace(/\/+$/, "") || "/";
}
export function getPageFamily(route) {
  const value = normalizeSitePath(route);
  const under = prefix => value === prefix || value.startsWith(prefix + "/");
  if (ALTEA_PATH_PREFIXES.some(under)) return "altea";
  return INTERNAL_PATH_PREFIXES.some(under) ? "riaintra" : "public";
}
export function getPageChrome(route) {
  return CHROME_FREE_PATHS.includes(normalizeSitePath(route)) ? "none" : getPageFamily(route);
}
export function resolveBuildRoute(value) {
  if (!isSafeInternalRoute(value)) return null;
  const pathname = normalizeSitePath(value);
  const routes = { ...SITE_MAP, ...APP_ROUTES };
  const entries = Object.entries(routes).filter(([, route]) => !/[?#]/.test(route));
  const exact = entries.find(([, route]) => normalizeSitePath(route) === pathname);
  if (exact) return { key:exact[0], route:exact[1] };
  // Only explicit templates in the canonical registry may match dynamic URLs.
  const dynamic = entries.filter(([, route]) => /(^|\/):[A-Za-z][\w]*|\[[A-Za-z][\w]*\]/.test(route));
  const matches = dynamic.filter(([, route]) => {
    const a = normalizeSitePath(route).split("/"), b = pathname.split("/");
    return a.length === b.length && a.every((part, i) => /^:[a-z][\w]*$|^\[[a-z][\w]*\]$/.test(part) ? Boolean(b[i]) : part === b[i]);
  });
  return matches.length === 1 ? { key:matches[0][0], route:matches[0][1] } : null;
}
