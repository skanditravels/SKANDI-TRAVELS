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

function post(html, type, payload = {}) {
  html.postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() });
}
function clean(v, max = 500) { return String(v ?? "").trim().slice(0, max); }
function normalizeSearch(search = {}) {
  return {
    tripType: "hotelOnly",
    destination: clean(search.destination || search.area || search.city || wixLocation.query.destination || wixLocation.query.area || "", 160),
    departureDate: clean(search.checkInDate || search.departureDate || wixLocation.query.checkIn || "", 10),
    returnDate: clean(search.checkOutDate || search.returnDate || wixLocation.query.checkOut || "", 10),
    adults: Math.max(1, Number(search.adults || wixLocation.query.adults || 2)),
    children: Math.max(0, Number(search.children || wixLocation.query.children || 0)),
    rooms: Math.max(1, Number(search.rooms || wixLocation.query.rooms || 1)),
    currency: clean(search.currency || wixLocation.query.currency || "USD", 3).toUpperCase()
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
        const inventory = await getPublicDestinationFinderData({});
        post(html, "HOTEL_SEARCH_PAGE_RESULT", {
          countries: inventory?.countries || [],
          areas: inventory?.areas || [],
          supplier: "DUFFEL_STAYS",
          liveAvailability: true
        });
        return;
      }
      if (message.type === "HOTEL_SEARCH_RUN") {
        const search = normalizeSearch(payload.search || {});
        const result = await searchUnifiedOffers({ search });
        post(html, "HOTEL_SEARCH_RESULTS", { items: result?.items || [], search, supplier: "DUFFEL_STAYS" });
        return;
      }
      if (message.type === "HOTEL_SEARCH_SELECT") {
        const offer = payload.offer || payload.hotel || {};
        const search = normalizeSearch(payload.search || offer.searchContext || {});
        const cart = await createBookingCartFromOffer({ offer, search });
        if (cart?.cartId) session.setItem("SKANDI_BOOKING_CART_ID", cart.cartId);
        if (cart?.cartToken) session.setItem("SKANDI_BOOKING_CART_TOKEN", cart.cartToken);
        post(html, "HOTEL_SEARCH_BOOKING_CART", cart || {});
        wixLocation.to(`/booking?step=offer&cartId=${encodeURIComponent(cart.cartId)}${cart.cartToken ? `&cartToken=${encodeURIComponent(cart.cartToken)}` : ""}`);
        return;
      }
      if (message.type === "HOTEL_SEARCH_VIEW_HOTEL") {
        const path = clean(payload.path, 600);
        if (path.startsWith("/hotels/")) wixLocation.to(path);
        return;
      }
    } catch (error) {
      post(html, "HOTEL_SEARCH_ERROR", { message: error?.publicMessage || error?.message || "Live hotel availability is temporarily unavailable." });
    }
  });
});
