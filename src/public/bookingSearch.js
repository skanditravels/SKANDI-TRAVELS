// /src/public/bookingSearch.js
// One browser-session handoff from Home to the dedicated booking offer state.
// Search criteria are untrusted UI state; prices, offers and ownership are resolved by the backend.
import { local, session } from "wix-storage";
import { APP_ROUTES } from "public/siteMap";

const KEY = "SKANDI_BOOKING_SEARCH";
const MAX_AGE = 2 * 60 * 60 * 1000;
const RECENT_KEY = "SKANDI_RECENT_TRAVEL_SEARCH";
const DRAFT_KEY = "SKANDI_RESUMABLE_BOOKING";
const CART_KEY = "SKANDI_BOOKING_CART_ID";
const RECENT_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const DRAFT_STATUSES = new Set(["Open","OfferAccepted","ExtrasSaved","TravelersPending","TravelersSaved","PaymentReady"]);
const strings = ["tripType","productType","accommodationType","origin","originIata","originLabel","originType","departureLabel","destination","destinationIata","destinationLabel","destinationCode","destinationRegion","destinationType","destinationCountry","destinationCountrySlug","destinationSlug","destinationAreaSlug","countrySlug","areaSlug","hotelSlug","accommodationId","departureDate","returnDate","checkInDate","checkOutDate","travelClass","cabinClass","cabin","flightType","language","locale","currency","budgetCurrency","collectionLevel","skandiTier"];
export function normalizeBookingSearch(input = {}) {
  const search = {};
  for (const key of strings) if (typeof input[key] === "string") search[key] = input[key].trim().slice(0,240);
  for (const key of ["adults","children","infants","rooms","nights","maxStops","maxConnections"]) {
    if (input[key] != null && input[key] !== "") {
      const n = Number(input[key]);
      if (Number.isFinite(n)) search[key] = n;
    }
  }
  const budget = Number(input.maxTripTotal);
  if (Number.isFinite(budget) && budget > 0 && budget <= 10000000 && /^[A-Z]{3}$/.test(search.budgetCurrency || "")) {
    search.maxTripTotal = budget;
  }
  for (const key of ["childAges","infantAges"]) if (Array.isArray(input[key])) search[key] = input[key].slice(0,9).map(Number);
  for (const key of ["oneWay","directOnly","nonStop"]) if (typeof input[key] === "boolean") search[key] = input[key];
  if (Array.isArray(input.guests)) search.guests = input.guests.slice(0,18).map(g => Number.isFinite(Number(g?.age)) && g?.age !== null ? {type:g?.type === "child" ? "child" : "adult",age:Number(g.age)} : {type:g?.type === "child" ? "child" : "adult"});
  if (input.location && typeof input.location === "object") {
    const l = input.location, location = {};
    for (const k of ["iata","destination","locationText","label"]) if (typeof l[k] === "string") location[k] = l[k].slice(0,240);
    for (const k of ["latitude","longitude"]) if (l[k] !== null && l[k] !== "" && Number.isFinite(Number(l[k]))) location[k] = Number(l[k]);
    search.location = location;
  }
  return search;
}
export function startBookingSearch(input = {}, source = "HOME") {
  const search = normalizeBookingSearch(input);
  if (!search.departureDate && !search.checkInDate) throw new Error("Select travel dates before searching.");
  const id = "search-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,12);
  const now = Date.now();
  session.setItem(KEY, JSON.stringify({ id, createdAt:now, source, search }));
  // Browser-local planning stores route preferences only. Booking capability stays in the booking session.
  if (["HOME", "FLIGHTS", "BOOKING_RETRY"].includes(source)) {
    try {
      const recent = {...search};
      delete recent.guests;
      delete recent.location;
      local.setItem(RECENT_KEY, JSON.stringify({createdAt:now, search:recent}));
    } catch (_) {}
  }
  return APP_ROUTES.bookingFlow + "?step=offer&searchId=" + encodeURIComponent(id);
}
export function readBookingSearch(id) {
  try {
    const stored = JSON.parse(session.getItem(KEY) || "null");
    if (!stored || !id || stored.id !== id || !Number.isFinite(stored.createdAt) || Date.now()-stored.createdAt > MAX_AGE || stored.createdAt>Date.now()+60000) return null;
    return { ...stored, search:normalizeBookingSearch(stored.search) };
  } catch (_) { return null; }
}


export function readRecentTravelSearch() {
  try {
    const saved = JSON.parse(local.getItem(RECENT_KEY) || "null");
    const age = Date.now() - saved?.createdAt;
    if (!Number.isFinite(age) || age < 0 || age > RECENT_MAX_AGE || !saved?.search?.destination) return null;
    return normalizeBookingSearch(saved.search);
  } catch (_) { return null; }
}
export function rememberResumableBooking(cart) {
  try {
    const expiresAt = Date.parse(cart?.expiresAt || "");
    const matchesSession = cart?.cartId && cart.cartId === session.getItem(CART_KEY);
    if (!matchesSession || !DRAFT_STATUSES.has(cart.status) || !(expiresAt > Date.now())) {
      if (matchesSession) session.removeItem(DRAFT_KEY);
      return;
    }
    session.setItem(DRAFT_KEY, JSON.stringify({id:cart.cartId, expiresAt}));
  } catch (_) {}
}
export function readResumableBooking() {
  try {
    const draft = JSON.parse(session.getItem(DRAFT_KEY) || "null");
    if (!(draft?.expiresAt > Date.now()) || draft.id !== session.getItem(CART_KEY)) return null;
    return {path:APP_ROUTES.bookingFlow+"?cartId="+encodeURIComponent(draft.id)};
  } catch (_) { return null; }
}
export function shiftedBookingDates(search, days, today = new Date().toISOString().slice(0, 10)) {
  if (![-3, 3].includes(days)) return null;
  const result = {...search};
  const keys = ["departureDate","returnDate","checkInDate","checkOutDate"];
  for (const key of keys) {
    const raw = result[key];
    if (!raw) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
    const date = new Date(raw+"T00:00:00Z");
    if (!Number.isFinite(date.valueOf()) || date.toISOString().slice(0,10)!==raw) return null;
    date.setUTCDate(date.getUTCDate()+days);
    result[key] = date.toISOString().slice(0,10);
  }
  const first = result.departureDate || result.checkInDate;
  return first && first >= today ? result : null;
}
