// /src/pages/Search.b7zch.js
// Wix page: Search
// URL: /search
// HTML Embed ID: #searchResultsEmbed
// SKANDI B-011.1 public page-search bridge.

import wixLocationFrontend from "wix-location-frontend";
import {
  SITE_MAP,
  APP_ROUTES,
  isSafeInternalRoute
} from "public/siteMap";

const VERSION = "B-011.1";
const EMBED_ID = "#searchResultsEmbed";
const CHILD_SOURCE = "SKANDI_SEARCH_RESULTS";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const EXCLUDED_PREFIXES = ["/riaintra", "/my-profile"];

const PUBLIC_SEARCH_INDEX = Object.freeze([
  Object.freeze({
    title: "Home",
    path: SITE_MAP.home,
    category: "SKANDI",
    description: "Start planning with SKANDI Travels.",
    keywords: "home homepage travel booking search inspiration",
    priority: 4
  }),
  Object.freeze({
    title: "Flights",
    path: SITE_MAP.flights,
    category: "Book",
    description: "Search and book flights with SKANDI Travels.",
    keywords: "flight flights airline airfare tickets plane aviation booking air",
    priority: 12
  }),
  Object.freeze({
    title: "Hotels",
    path: SITE_MAP.hotels,
    category: "Book",
    description: "Search and book hotels and stays.",
    keywords: "hotel hotels accommodation resort room stay lodging",
    priority: 12
  }),
  Object.freeze({
    title: "Packages",
    path: SITE_MAP.packages,
    category: "Book",
    description: "Explore flight and hotel holiday packages.",
    keywords: "package packages holiday vacation flight hotel bundle",
    priority: 10
  }),
  Object.freeze({
    title: "Tours & Activities",
    path: SITE_MAP.tours,
    category: "Book",
    description: "Find experiences, excursions, tours and activities.",
    keywords: "tour tours activity activities excursion experience attraction ticket things to do",
    priority: 9
  }),
  Object.freeze({
    title: "Activities",
    path: SITE_MAP.activities,
    category: "Book",
    description: "Browse activities and experiences available through SKANDI.",
    keywords: "activity activities attraction experience excursion tickets",
    priority: 5
  }),
  Object.freeze({
    title: "Airport Transfer",
    path: SITE_MAP.transfers,
    category: "Book",
    description: "Arrange airport and destination transfers.",
    keywords: "transfer transfers taxi shuttle airport transport transportation pickup",
    priority: 9
  }),
  Object.freeze({
    title: "Car Rental",
    path: SITE_MAP.carRental,
    category: "Book",
    description: "Search live rental cars for your trip.",
    keywords: "car rental hire vehicle drive road rental car",
    priority: 10
  }),
  Object.freeze({
    title: "Offers",
    path: SITE_MAP.offers,
    category: "Book",
    description: "Browse current SKANDI travel offers.",
    keywords: "offer offers deal deals sale last chance travel",
    priority: 7
  }),
  Object.freeze({
    title: "Destinations",
    path: SITE_MAP.destinations,
    category: "Discover",
    description: "Explore SKANDI destinations, countries, resorts and areas.",
    keywords: "destination destinations country area resort city travel guide inspiration",
    priority: 11
  }),
  Object.freeze({
    title: "SKANDI Collection",
    path: SITE_MAP.skandiCollection,
    category: "Discover",
    description: "Explore curated SKANDI Collection travel partners and stays.",
    keywords: "collection curated hotel partner signature select excelsior recommended stay",
    priority: 8
  }),
  Object.freeze({
    title: "VOY Magazine",
    path: SITE_MAP.voy,
    category: "Discover",
    description: "Read VOY, the SKANDI travel magazine.",
    keywords: "voy magazine editorial travel inspiration guide story",
    priority: 6
  }),
  Object.freeze({
    title: "Travel Information",
    path: SITE_MAP.travelInfo,
    category: "Travel Info",
    description: "Practical information for planning and managing your journey.",
    keywords: "travel info information before travel airport airline baggage passport visa insurance assistance",
    priority: 12
  }),
  Object.freeze({
    title: "Flight Status",
    path: APP_ROUTES.flightStatus,
    category: "Travel Info",
    description: "Check flight status and operational airport information.",
    keywords: "flight status departure arrival delay cancelled canceled gate airport fids",
    priority: 12
  }),
  Object.freeze({
    title: "Passport & Visa",
    path: APP_ROUTES.passportVisa,
    category: "Travel Info",
    description: "Review passport, visa and connected travel-requirement guidance.",
    keywords: "passport visa entry requirement requirements documents nationality travel documents esta",
    priority: 11
  }),
  Object.freeze({
    title: "Baggage Allowance",
    path: APP_ROUTES.baggageAllowance,
    category: "Travel Info",
    description: "Find baggage guidance and allowance information.",
    keywords: "baggage allowance luggage bag carry on checked bag hand luggage",
    priority: 11
  }),
  Object.freeze({
    title: "Travel Insurance",
    path: APP_ROUTES.travelInsurance,
    category: "Travel Info",
    description: "Read SKANDI travel-insurance information and guidance.",
    keywords: "travel insurance cover coverage protection policy trip insurance",
    priority: 8
  }),
  Object.freeze({
    title: "Special Assistance",
    path: APP_ROUTES.specialAssistance,
    category: "Travel Info",
    description: "Find special-assistance information before travel.",
    keywords: "special assistance accessibility wheelchair disability reduced mobility support",
    priority: 8
  }),
  Object.freeze({
    title: "Support",
    path: SITE_MAP.support,
    category: "Support",
    description: "Get help before, during and after your trip.",
    keywords: "support help customer service assistance contact case complaint issue booking help center",
    priority: 12
  }),
  Object.freeze({
    title: "SKANDI Club",
    path: SITE_MAP.club,
    category: "Club",
    description: "SKANDI Club membership, benefits, points and tiers.",
    keywords: "club loyalty member membership points rewards benefits silver gold diamond",
    priority: 10
  }),
  Object.freeze({
    title: "The Store",
    path: SITE_MAP.theStore,
    category: "Store",
    description: "Browse the SKANDI Store.",
    keywords: "store shop merchandise travel accessories products order",
    priority: 7
  }),
  Object.freeze({
    title: "About SKANDI",
    path: SITE_MAP.about,
    category: "SKANDI",
    description: "Learn about SKANDI Travels and the SKANDI Group.",
    keywords: "about company skandi group travels story values",
    priority: 7
  }),
  Object.freeze({
    title: "Our Network",
    path: SITE_MAP.ourNetwork,
    category: "SKANDI",
    description: "Explore the SKANDI network and travel footprint.",
    keywords: "network map destinations airlines routes hotels partners airports",
    priority: 7
  }),
  Object.freeze({
    title: "Newsroom",
    path: SITE_MAP.newsroom,
    category: "SKANDI",
    description: "Read public SKANDI news and announcements.",
    keywords: "news newsroom press media announcement release",
    priority: 6
  }),
  Object.freeze({
    title: "Careers",
    path: APP_ROUTES.careers,
    category: "SKANDI",
    description: "Explore careers and opportunities with SKANDI.",
    keywords: "career careers job jobs work vacancy employment hiring",
    priority: 5
  }),
  Object.freeze({
    title: "Legal",
    path: SITE_MAP.legal,
    category: "Legal",
    description: "Open SKANDI legal information, policies and customer terms.",
    keywords: "legal privacy policy policies cookies accessibility terms conditions booking terms data",
    priority: 8
  })
]);

let html;

$w.onReady(() => {
  html = $w(EMBED_ID);
  html.onMessage(handleMessage);
  pushIndex();
  pushQuery();
});

function normalizedQuery(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 100);
}

function currentQuery() {
  try {
    const query = wixLocationFrontend.query || {};
    if (typeof query.q === "string") {
      return normalizedQuery(query.q);
    }
  } catch (_) {}

  try {
    const url = String(wixLocationFrontend.url || "");
    if (url) {
      return normalizedQuery(new URL(url).searchParams.get("q") || "");
    }
  } catch (_) {}

  return "";
}

function push(type, payload = {}) {
  if (!html) return;

  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function isExcluded(path) {
  const pathname = String(path || "")
    .split("?")[0]
    .split("#")[0]
    .toLowerCase();

  return EXCLUDED_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

function publicSearchItems() {
  return PUBLIC_SEARCH_INDEX
    .filter(item => isSafeInternalRoute(item.path))
    .filter(item => !isExcluded(item.path))
    .map(item => ({ ...item }));
}

function pushIndex() {
  push("SEARCH_INDEX_UPDATE", {
    version: VERSION,
    items: publicSearchItems()
  });
}

function pushQuery() {
  push("SEARCH_PAGE_QUERY", {
    query: currentQuery()
  });
}

function searchUrl(query) {
  const value = normalizedQuery(query);
  return value ? `/search?q=${encodeURIComponent(value)}` : "/search";
}

function handleMessage(event) {
  const message = event?.data || {};
  if (message.source !== CHILD_SOURCE) return;

  const payload = message.payload || {};

  switch (message.type) {
    case "SEARCH_READY":
      pushIndex();
      pushQuery();
      return;

    case "SEARCH_QUERY_UPDATE": {
      const nextQuery = normalizedQuery(payload.query);
      if (nextQuery === currentQuery()) {
        pushQuery();
        return;
      }
      wixLocationFrontend.to(searchUrl(nextQuery));
      return;
    }

    case "SEARCH_RESULT_NAVIGATE": {
      const path = String(payload.path || "").trim();
      if (!isSafeInternalRoute(path) || isExcluded(path)) return;
      wixLocationFrontend.to(path);
      return;
    }

    case "SEARCH_RESIZE": {
      const requested = Number(payload.height || 0);
      if (!Number.isFinite(requested) || requested <= 0) return;
      html.height = Math.max(620, Math.min(12000, Math.round(requested)));
      return;
    }
  }
}
