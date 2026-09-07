import wixLocation from "wix-location-frontend";
import { session } from "wix-storage";
import {
  searchUnifiedOffers,
  createBookingCartFromOffer
} from "backend/bookingOrchestrator.web";
import { getPublicInventoryRecord } from "backend/FINAL/publicInventory.web";
import { searchDuffelStays } from "backend/RIA/duffelGroundProducts.web";

const EMBED_ID = "#hotelDetailEmbed";
const CHILD_SOURCE = "SKANDI_HOTEL_DETAIL";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

let hotelRecord = null;
let hotelPage = null;

function post(html, type, payload = {}) { html.postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() }); }
function clean(v, max = 500) { return String(v ?? "").trim().slice(0, max); }
function lower(v, max = 500) { return clean(v, max).toLowerCase(); }
function arr(v) { return Array.isArray(v) ? v : []; }
function obj(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
function first(...values) { return values.find(v => v !== undefined && v !== null && v !== "") ?? ""; }
function slug(v) { return clean(v, 180).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
function imageUrl(value) { return clean(typeof value === "string" ? value : value?.url || value?.src || "", 1200); }
function addDays(date, days) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean(date, 10))) return "";
  const n = Math.max(1, Math.min(60, Number(days) || 1));
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
}
function pathParts() { return arr(wixLocation.path).map(v => decodeURIComponent(String(v))); }
function hotelSlug() {
  const parts = pathParts();
  return slug(first(parts[parts.length - 1], wixLocation.query.hotel));
}
function routeHierarchy() {
  const p = pathParts();
  return {
    countrySlug: slug(first(wixLocation.query.country, p[0] === "hotels" ? p[1] : "")),
    destinationSlug: slug(first(wixLocation.query.destination, p[0] === "hotels" ? p[2] : "")),
    areaSlug: slug(first(wixLocation.query.area, p[0] === "hotels" && p.length > 4 ? p[3] : ""))
  };
}
function galleryOf(record = {}) {
  const media = obj(record.media);
  return [...new Set([
    imageUrl(record.heroImage), imageUrl(record.image), imageUrl(media.hero), imageUrl(media.primary),
    ...arr(record.gallery).map(imageUrl), ...arr(media.gallery).map(imageUrl)
  ].filter(Boolean))];
}
function normalizeRoom(room = {}, gallery = []) {
  return {
    id: clean(first(room.id, room.code, slug(room.name)), 160),
    code: clean(room.code, 80),
    name: clean(room.name, 240),
    description: clean(room.description, 4000),
    image: imageUrl(first(room.image, room.photo, gallery[0])),
    capacity: Number(first(room.maxGuests, room.capacity, 0)) || 0,
    size: Number(first(room.sizeSqm, room.size, 0)) ? `${Number(first(room.sizeSqm, room.size))} m²` : "",
    bedType: clean(room.bedType, 160),
    roomType: clean(room.roomType, 160),
    features: arr(first(room.features, room.amenities, []))
  };
}
function mapHotelPage(record = {}) {
  const d = obj(record.details);
  const hierarchy = routeHierarchy();
  const countryName = clean(first(d.countryName, record.countryName, hierarchy.countrySlug), 200);
  const destinationName = clean(first(d.city, record.destinationName, hierarchy.destinationSlug, d.destinationName), 200);
  const countrySlug = slug(first(hierarchy.countrySlug, d.countrySlug, countryName));
  const destinationSlug = slug(first(hierarchy.destinationSlug, d.destinationSlug, destinationName));
  const areaSlug = slug(first(hierarchy.areaSlug, d.areaSlug, destinationSlug));
  const gallery = galleryOf(record);
  const facts = arr(d.facts);
  const facilities = arr(d.facilities);
  const lat = Number(first(d.latitude, record.latitude));
  const lng = Number(first(d.longitude, record.longitude));
  const address = [d.address, d.postalCode, d.city].filter(Boolean).join(", ");
  return {
    id: record.id || "",
    hotelSlug: slug(first(record.slug, record.name)),
    name: clean(record.name, 240),
    countrySlug,
    countryName,
    destinationSlug,
    destinationName,
    areaSlug,
    areaName: clean(first(d.areaName, destinationName), 200),
    destinationCode: clean(first(d.searchAirportIata, d.destinationIata), 3).toUpperCase(),
    providerHotelId: clean(first(d.duffelAccommodationId, d.providerAccommodationId), 180),
    heroImage: gallery[0] || "",
    gallery,
    summary: clean(first(record.description, record.summary, d.shortDescription), 4000),
    description: clean(first(record.description, record.summary, d.description), 8000),
    officialClassification: Number(first(d.officialStarRating, record.rating, 0)) || 0,
    skandiRating: Number(first(d.skandiRating, 0)) || 0,
    guestRating: Number(first(d.guestRating, 0)) || 0,
    reviewCount: Number(first(d.reviewCount, 0)) || 0,
    facts,
    facilities,
    rooms: arr(d.rooms).map(room => normalizeRoom(room, gallery)),
    boardOptions: arr(d.boardOptions),
    checkinTime: clean(d.checkinTime, 40),
    checkoutTime: clean(d.checkoutTime, 40),
    propertyType: clean(d.propertyType, 100),
    minimumCheckinAge: Number(first(d.minimumCheckinAge, 0)) || 0,
    locationTransfer: {
      address,
      latitude: Number.isFinite(lat) ? lat : null,
      longitude: Number.isFinite(lng) ? lng : null,
      airportDistance: Number(first(d.distanceToAirport, 0)) ? `${Number(d.distanceToAirport)} km` : "",
      transferTime: Number(first(d.transferTimeMinutes, 0)) ? `${Number(d.transferTimeMinutes)} min` : "",
      centerDistance: Number(first(d.distanceToCenter, 0)) ? `${Number(d.distanceToCenter)} km` : "",
      beachDistance: Number(first(d.distanceToBeach, 0)) ? `${Number(d.distanceToBeach)} m` : "",
      phone: clean(first(d.phone, d.contactPhone), 80),
      email: clean(first(d.email, d.contactEmail), 254)
    },
    climate: arr(d.climate),
    reviews: arr(d.reviews),
    selection: {
      origin: clean(wixLocation.query.origin, 100),
      departureDate: clean(first(wixLocation.query.QueryDepDate, wixLocation.query.departureDate), 10),
      duration: Number(first(wixLocation.query.QueryDur, wixLocation.query.nights, 8)) || 8,
      travelers: Number(first(wixLocation.query.adults, 2)) || 2,
      meal: clean(first(wixLocation.query.SelectedMeals, "noselection"), 80),
      roomKey: clean(wixLocation.query.RoomKey, 160)
    },
    supplier: "DUFFEL_STAYS",
    liveAvailability: true
  };
}
function searchOf(payload = {}, hotel = {}) {
  const d = obj(hotel.details);
  const departureDate = clean(first(payload.checkInDate, payload.departureDate, wixLocation.query.checkIn, wixLocation.query.departureDate, wixLocation.query.QueryDepDate), 10);
  const nights = Math.max(1, Number(first(payload.nights, payload.duration, wixLocation.query.nights, wixLocation.query.QueryDur, 0)) || 0);
  const returnDate = clean(first(payload.checkOutDate, payload.returnDate, wixLocation.query.checkOut, wixLocation.query.returnDate), 10) || (departureDate && nights ? addDays(departureDate, nights) : "");
  return {
    tripType: "hotelOnly",
    destination: clean(first(payload.destination, payload.destinationIata, payload.destinationCode, d.searchAirportIata, d.city, wixLocation.query.destination), 160),
    destinationRegion: clean(first(payload.destinationRegion, d.city), 160),
    departureDate,
    returnDate,
    adults: Math.max(1, Number(first(payload.adults, payload.travelers, wixLocation.query.adults, 2)) || 2),
    children: Math.max(0, Number(first(payload.children, wixLocation.query.children, 0)) || 0),
    childAges: arr(payload.childAges),
    rooms: Math.max(1, Number(first(payload.rooms, wixLocation.query.rooms, 1)) || 1),
    currency: clean(first(payload.currency, wixLocation.query.currency, "USD"), 3).toUpperCase(),
    language: clean(first(payload.language, payload.locale, "EN"), 12).toUpperCase()
  };
}
function sameAccommodation(item, record) {
  const d = obj(record.details);
  const targetId = clean(first(d.duffelAccommodationId, d.providerAccommodationId), 180);
  if (targetId && clean(item.accommodationId, 180) === targetId) return true;
  const a = lower(record.name, 240).replace(/[^a-z0-9]/g, "");
  const b = lower(item.title, 240).replace(/[^a-z0-9]/g, "");
  return Boolean(a && b && a === b);
}

$w.onReady(() => {
  const html = $w(EMBED_ID);
  html.onMessage(async event => {
    const message = event.data || {};
    if (message.source !== CHILD_SOURCE) return;
    const payload = message.payload || {};
    try {
      if (message.type === "HOTEL_DETAIL_READY") {
        const result = await getPublicInventoryRecord({ entityType: "HOTEL", slug: hotelSlug(), language: payload?.settings?.language || "EN" });
        hotelRecord = result?.record || result || null;
        if (!hotelRecord?.name) throw new Error("Hotel not found.");
        hotelPage = mapHotelPage(hotelRecord);
        post(html, "HOTEL_DETAIL_DATA", { page: hotelPage, supplier: "DUFFEL_STAYS" });
        return;
      }
      if (message.type === "HOTEL_DETAIL_CHECK_AVAILABILITY") {
        if (!hotelRecord) throw new Error("Hotel information is not loaded yet.");
        const search = searchOf(payload.search || payload, hotelRecord);
        const d = obj(hotelRecord.details);
        const accommodationId = clean(first(d.duffelAccommodationId, d.providerAccommodationId), 180);
        let items = [];
        if (accommodationId) {
          const targeted = await searchDuffelStays({
            accommodationId,
            checkInDate: search.departureDate,
            checkOutDate: search.returnDate,
            adults: search.adults,
            children: search.children,
            childAges: search.childAges,
            rooms: search.rooms,
            fetchRates: true
          });
          items = arr(targeted?.items).map(item => ({
            ...item,
            itemType: "HOTEL",
            productType: "HOTEL",
            provider: "SKANDI",
            source: "LIVE_STAY",
            sourceLabel: "Live hotel availability",
            price: { amount: Number(item.total || 0), total: Number(item.total || 0), currency: item.currency || search.currency },
            total: Number(item.total || 0),
            currency: item.currency || search.currency,
            tripType: "Hotel",
            searchContext: search
          }));
        } else {
          const result = await searchUnifiedOffers({ search });
          items = arr(result?.items).filter(item => sameAccommodation(item, hotelRecord));
        }
        post(html, "HOTEL_DETAIL_AVAILABILITY_RESULT", { items, search, supplier: "DUFFEL_STAYS" });
        return;
      }
      if (message.type === "HOTEL_DETAIL_SELECT_OFFER") {
        const offer = payload.offer || {};
        if (!offer?.id && !offer?.staySearchResultId) throw new Error("Select a live hotel rate first.");
        const search = searchOf(payload.search || offer.searchContext || {}, hotelRecord || {});
        const cart = await createBookingCartFromOffer({ offer, search });
        if (!cart?.cartId) throw new Error("The booking cart could not be created.");
        if (cart.cartId) session.setItem("SKANDI_BOOKING_CART_ID", cart.cartId);
        if (cart.cartToken) session.setItem("SKANDI_BOOKING_CART_TOKEN", cart.cartToken);
        post(html, "HOTEL_DETAIL_BOOKING_CART", cart || {});
        wixLocation.to(`/booking?step=offer&cartId=${encodeURIComponent(cart.cartId)}${cart.cartToken ? `&cartToken=${encodeURIComponent(cart.cartToken)}` : ""}`);
        return;
      }
    } catch (error) {
      post(html, "HOTEL_DETAIL_ERROR", { message: error?.publicMessage || error?.message || "Live hotel availability is temporarily unavailable." });
    }
  });
});
