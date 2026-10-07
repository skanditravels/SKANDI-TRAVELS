// /src/public/bookingSearch.js
// One browser-session handoff to the canonical /booking offer state.
// Search criteria are untrusted UI state; prices, offers and ownership are resolved by the backend.
import { session } from "wix-storage";
import { APP_ROUTES } from "public/siteMap";

const KEY = "SKANDI_BOOKING_SEARCH";
const MAX_AGE = 2 * 60 * 60 * 1000;
const strings = ["tripType","productType","accommodationType","origin","originIata","originLabel","departureLabel","destination","destinationIata","destinationLabel","destinationCode","destinationRegion","destinationType","destinationCountry","destinationCountrySlug","destinationSlug","destinationAreaSlug","countrySlug","areaSlug","hotelSlug","accommodationId","departureDate","returnDate","checkInDate","checkOutDate","travelClass","cabinClass","cabin","flightType","language","locale","currency","collectionLevel","skandiTier"];
export function normalizeBookingSearch(input = {}) {
  const search = {};
  for (const key of strings) if (typeof input[key] === "string") search[key] = input[key].trim().slice(0,240);
  for (const key of ["adults","children","infants","rooms","nights","maxStops"]) {
    if (input[key] !== undefined && input[key] !== "") {
      const n = Number(input[key]);
      if (Number.isFinite(n)) search[key] = n;
    }
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
  session.setItem(KEY, JSON.stringify({ id, createdAt:Date.now(), source, search }));
  return APP_ROUTES.bookingFlow + "?step=offer&searchId=" + encodeURIComponent(id);
}
export function readBookingSearch(id) {
  try {
    const stored = JSON.parse(session.getItem(KEY) || "null");
    if (!stored || !id || stored.id !== id || !Number.isFinite(stored.createdAt) || Date.now()-stored.createdAt > MAX_AGE || stored.createdAt>Date.now()+60000) return null;
    return { ...stored, search:normalizeBookingSearch(stored.search) };
  } catch (_) { return null; }
}
