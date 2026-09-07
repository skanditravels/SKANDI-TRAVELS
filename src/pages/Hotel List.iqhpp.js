import wixLocation from "wix-location-frontend";
import { session } from "wix-storage";
import {
  searchUnifiedOffers,
  createBookingCartFromOffer
} from "backend/bookingOrchestrator.web";
import { getPublicDestinationFinderData } from "backend/FINAL/publicInventory.web";

const EMBED_ID = "#hotelsEmbed";
const CHILD_SOURCE = "SKANDI_HOTEL_SEARCH";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

let finder = { countries: [], areas: [], hotels: [] };
let pageContext = null;

function post(html, type, payload = {}) {
  html.postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() });
}
function clean(v, max = 500) { return String(v ?? "").trim().slice(0, max); }
function lower(v, max = 500) { return clean(v, max).toLowerCase(); }
function arr(v) { return Array.isArray(v) ? v : []; }
function obj(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
function first(...values) { return values.find(v => v !== undefined && v !== null && v !== "") ?? ""; }
function slug(v) {
  return clean(v, 180).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function imageOf(item = {}) {
  const media = obj(item.media);
  const gallery = arr(item.gallery);
  return clean(first(item.image, item.imageUrl, item.heroImage, item.cardImage, media.hero, media.primary,
    typeof gallery[0] === "string" ? gallery[0] : gallery[0]?.url), 1200);
}
function pathParts() { return arr(wixLocation.path).map(v => decodeURIComponent(String(v))); }
function routeContext() {
  const p = pathParts();
  const q = wixLocation.query || {};
  return {
    countrySlug: slug(q.country || (p[0] === "hotels" ? p[1] : "")),
    destinationSlug: slug(q.destination || (p[0] === "hotels" ? p[2] : "")),
    areaSlug: slug(q.area || (p[0] === "hotels" ? p[3] : ""))
  };
}
function countryFor(countrySlug) {
  const needle = slug(countrySlug);
  return finder.countries.find(c => slug(c.slug || c.id || c.name) === needle) || finder.countries[0] || null;
}
function areasForCountry(country) {
  if (!country) return finder.areas;
  const ids = new Set([clean(country.id), clean(country.slug), slug(country.name)].filter(Boolean));
  return finder.areas.filter(a => ids.has(clean(a.countryId)) || ids.has(clean(a.countrySlug)) || slug(a.countryName) === slug(country.name));
}
function areaFor(country, destinationSlug, areaSlug) {
  const rows = areasForCountry(country);
  const candidates = [areaSlug, destinationSlug].map(slug).filter(Boolean);
  for (const candidate of candidates) {
    const match = rows.find(a => slug(a.slug || a.id || a.name) === candidate);
    if (match) return match;
  }
  return rows[0] || null;
}
function hotelMatchesArea(hotel, area) {
  if (!area) return true;
  const areaIds = new Set([clean(area.id), clean(area.slug), slug(area.name)].filter(Boolean));
  return areaIds.has(clean(hotel.areaId)) || areaIds.has(clean(hotel.destinationId)) || areaIds.has(clean(hotel.areaSlug)) ||
    slug(hotel.area || hotel.city || hotel.destinationName) === slug(area.name);
}
function previewHotel(hotel, countrySlug, destinationSlug) {
  const details = obj(hotel.details);
  return {
    id: clean(first(hotel.id, hotel.slug, hotel.publicId)),
    hotelId: clean(first(hotel.id, hotel.publicId)),
    hotelSlug: slug(first(hotel.slug, hotel.name)),
    name: clean(hotel.name, 240),
    location: clean(first(hotel.location, hotel.address, details.city, details.address), 240),
    area: clean(first(hotel.area, details.city), 160),
    rating: Number(first(hotel.rating, details.skandiRating, details.officialStarRating, 0)) || 0,
    score: Number(first(hotel.score, details.guestRating, 0)) || 0,
    tags: arr(first(hotel.tags, details.facilities, [])),
    image: imageOf(hotel),
    imageUrl: imageOf(hotel),
    gallery: arr(hotel.gallery),
    summary: clean(first(hotel.description, hotel.summary, details.shortDescription), 1200),
    price: null,
    currency: "",
    isLive: false,
    supplier: "DUFFEL_STAYS",
    path: `/hotels/${countrySlug}/${destinationSlug}/${slug(first(hotel.slug, hotel.name))}`
  };
}
function buildPage() {
  const route = routeContext();
  const country = countryFor(route.countrySlug);
  const area = areaFor(country, route.destinationSlug, route.areaSlug);
  const countrySlug = slug(first(country?.slug, country?.id, country?.name, route.countrySlug));
  const destinationSlug = slug(first(area?.slug, area?.id, area?.name, route.destinationSlug, route.areaSlug));
  const areaSlug = slug(first(route.areaSlug, destinationSlug));
  const details = obj(area?.details);
  const hotels = finder.hotels.filter(h => hotelMatchesArea(h, area));
  const heroImage = imageOf(area) || imageOf(hotels[0]);
  const airportIata = clean(first(area?.destinationIata, area?.airportIata, area?.nearestAirportIata, details.searchAirportIata), 3).toUpperCase();
  return {
    id: clean(first(area?.id, destinationSlug)),
    slug: areaSlug,
    areaSlug,
    name: clean(first(area?.name, destinationSlug), 200),
    destinationSlug,
    destinationName: clean(first(area?.name, destinationSlug), 200),
    countrySlug,
    countryCode: clean(first(country?.code, country?.countryCode, obj(country?.details).countryCode), 3).toUpperCase(),
    countryName: clean(first(country?.name, obj(country?.details).countryName, countrySlug), 200),
    heroImage,
    intro: clean(first(area?.description, details.description, area?.summary), 1200),
    searchAirportIata: airportIata,
    destinationIata: airportIata,
    previewHotels: hotels.map(h => previewHotel(h, countrySlug, destinationSlug)),
    supplier: "DUFFEL_STAYS",
    liveAvailability: true
  };
}
function normalizeSearch(search = {}) {
  const destination = clean(first(
    search.destination,
    search.destinationIata,
    search.searchAirportIata,
    pageContext?.searchAirportIata,
    search.destinationAreaSlug,
    search.destinationSlug,
    search.area,
    search.city,
    wixLocation.query.destination,
    wixLocation.query.area
  ), 160);
  return {
    tripType: "hotelOnly",
    destination,
    destinationRegion: clean(first(search.destinationRegion, pageContext?.name), 160),
    departureDate: clean(first(search.checkInDate, search.departureDate, wixLocation.query.checkIn, wixLocation.query.departureDate), 10),
    returnDate: clean(first(search.checkOutDate, search.returnDate, wixLocation.query.checkOut, wixLocation.query.returnDate), 10),
    adults: Math.max(1, Number(first(search.adults, wixLocation.query.adults, 2)) || 2),
    children: Math.max(0, Number(first(search.children, wixLocation.query.children, 0)) || 0),
    childAges: arr(search.childAges),
    rooms: Math.max(1, Number(first(search.rooms, wixLocation.query.rooms, 1)) || 1),
    currency: clean(first(search.currency, wixLocation.query.currency, "USD"), 3).toUpperCase(),
    language: clean(first(search.language, search.locale, "EN"), 12).toUpperCase()
  };
}
function liveHotel(item) {
  const titleKey = lower(item.title, 240);
  const accommodationId = clean(item.accommodationId, 180);
  const matched = finder.hotels.find(h => {
    const d = obj(h.details);
    return (accommodationId && [d.duffelAccommodationId, d.providerAccommodationId, h.providerAccommodationId].map(clean).includes(accommodationId)) ||
      (titleKey && lower(h.name, 240) === titleKey);
  });
  const countrySlug = pageContext?.countrySlug || "";
  const destinationSlug = pageContext?.destinationSlug || "";
  return {
    ...item,
    id: clean(first(item.id, item.staySearchResultId)),
    name: clean(first(matched?.name, item.title), 240),
    image: imageOf(matched) || clean(item.imageUrl, 1200),
    imageUrl: imageOf(matched) || clean(item.imageUrl, 1200),
    location: clean(first(obj(matched?.details).city, item.location, pageContext?.name), 240),
    rating: Number(first(obj(matched?.details).officialStarRating, matched?.rating, 0)) || 0,
    score: Number(first(obj(matched?.details).guestRating, matched?.score, 0)) || 0,
    price: Number(first(item.total, item.price?.total, item.price?.amount, 0)) || 0,
    currency: clean(first(item.currency, item.price?.currency, "USD"), 3).toUpperCase(),
    isLive: true,
    offer: item,
    supplier: "DUFFEL_STAYS",
    hotelSlug: matched ? slug(first(matched.slug, matched.name)) : "",
    path: matched ? `/hotels/${countrySlug}/${destinationSlug}/${slug(first(matched.slug, matched.name))}` : ""
  };
}

$w.onReady(() => {
  const html = $w(EMBED_ID);
  html.onMessage(async event => {
    const message = event.data || {};
    if (message.source !== CHILD_SOURCE) return;
    const payload = message.payload || {};
    try {
      if (message.type === "HOTEL_SEARCH_READY") {
        const result = await getPublicDestinationFinderData({ language: payload?.settings?.language || "EN" });
        finder = {
          countries: arr(result?.countries),
          areas: arr(result?.areas),
          hotels: arr(result?.hotels)
        };
        pageContext = buildPage();
        post(html, "HOTEL_SEARCH_PAGE_RESULT", { page: pageContext });
        return;
      }
      if (message.type === "HOTEL_SEARCH_RUN") {
        const search = normalizeSearch(payload.search || {});
        const result = await searchUnifiedOffers({ search });
        post(html, "HOTEL_SEARCH_RESULTS", {
          items: arr(result?.items).map(liveHotel), search, supplier: "DUFFEL_STAYS"
        });
        return;
      }
      if (message.type === "HOTEL_SEARCH_SELECT") {
        const offer = payload.offer || payload.hotel?.offer || payload.hotel || {};
        const search = normalizeSearch(payload.search || offer.searchContext || {});
        const cart = await createBookingCartFromOffer({ offer, search });
        if (!cart?.cartId) throw new Error("The booking cart could not be created.");
        if (cart.cartId) session.setItem("SKANDI_BOOKING_CART_ID", cart.cartId);
        if (cart.cartToken) session.setItem("SKANDI_BOOKING_CART_TOKEN", cart.cartToken);
        post(html, "HOTEL_SEARCH_BOOKING_CART", cart || {});
        wixLocation.to(`/booking?step=offer&cartId=${encodeURIComponent(cart.cartId)}${cart.cartToken ? `&cartToken=${encodeURIComponent(cart.cartToken)}` : ""}`);
        return;
      }
      if (message.type === "HOTEL_SEARCH_VIEW_HOTEL") {
        const path = clean(payload.path || payload.hotel?.path, 600);
        if (path.startsWith("/hotels/")) wixLocation.to(path);
        return;
      }
    } catch (error) {
      post(html, "HOTEL_SEARCH_ERROR", { message: error?.publicMessage || error?.message || "Live hotel availability is temporarily unavailable." });
    }
  });
});
