import wixLocation from "wix-location-frontend";
import { session } from "wix-storage";
import {
  searchUnifiedOffers,
  createBookingCartFromOffer
} from "backend/bookingOrchestrator.web";
import { getPublicInventoryRecord } from "backend/FINAL/publicInventory.web";

const EMBED_ID = "#hotelDetailEmbed";
const CHILD_SOURCE = "SKANDI_HOTEL_DETAIL";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function post(html, type, payload = {}) { html.postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() }); }
function clean(v, max = 500) { return String(v ?? "").trim().slice(0, max); }
function hotelSlug() {
  const parts = (wixLocation.path || []).filter(Boolean);
  return clean(parts[parts.length - 1] || wixLocation.query.hotel || "", 180);
}
function searchOf(payload = {}, hotel = {}) {
  return {
    tripType: "hotelOnly",
    destination: clean(payload.destination || hotel?.details?.searchAirportIata || hotel?.details?.city || wixLocation.query.destination || "", 160),
    departureDate: clean(payload.checkInDate || payload.departureDate || wixLocation.query.checkIn || "", 10),
    returnDate: clean(payload.checkOutDate || payload.returnDate || wixLocation.query.checkOut || "", 10),
    adults: Math.max(1, Number(payload.adults || wixLocation.query.adults || 2)),
    children: Math.max(0, Number(payload.children || wixLocation.query.children || 0)),
    rooms: Math.max(1, Number(payload.rooms || wixLocation.query.rooms || 1)),
    currency: clean(payload.currency || wixLocation.query.currency || "USD", 3).toUpperCase()
  };
}

let hotelRecord = null;
$w.onReady(() => {
  const html = $w(EMBED_ID);
  html.onMessage(async event => {
    const message = event.data || {};
    if (message.source !== CHILD_SOURCE) return;
    const payload = message.payload || {};
    try {
      if (message.type === "HOTEL_DETAIL_READY") {
        hotelRecord = await getPublicInventoryRecord({ entityType: "HOTEL", slug: hotelSlug() });
        post(html, "HOTEL_DETAIL_RESULT", { hotel: hotelRecord?.record || hotelRecord || null, supplier: "DUFFEL_STAYS" });
        return;
      }
      if (message.type === "HOTEL_DETAIL_CHECK_AVAILABILITY") {
        const h = hotelRecord?.record || hotelRecord || {};
        const search = searchOf(payload.search || payload, h);
        const result = await searchUnifiedOffers({ search });
        const targetName = clean(h.name, 180).toLowerCase();
        const targetAccommodationId = clean(h?.details?.duffelAccommodationId || h?.details?.providerAccommodationId, 180);
        const items = (result?.items || []).filter(item => {
          if (targetAccommodationId && item.accommodationId === targetAccommodationId) return true;
          if (targetName && clean(item.title, 180).toLowerCase() === targetName) return true;
          return !targetAccommodationId && !targetName;
        });
        post(html, "HOTEL_DETAIL_AVAILABILITY_RESULT", { items, search, supplier: "DUFFEL_STAYS" });
        return;
      }
      if (message.type === "HOTEL_DETAIL_SELECT_OFFER") {
        const offer = payload.offer || {};
        const h = hotelRecord?.record || hotelRecord || {};
        const search = searchOf(payload.search || offer.searchContext || {}, h);
        const cart = await createBookingCartFromOffer({ offer, search });
        if (cart?.cartId) session.setItem("SKANDI_BOOKING_CART_ID", cart.cartId);
        if (cart?.cartToken) session.setItem("SKANDI_BOOKING_CART_TOKEN", cart.cartToken);
        wixLocation.to(`/booking?step=offer&cartId=${encodeURIComponent(cart.cartId)}${cart.cartToken ? `&cartToken=${encodeURIComponent(cart.cartToken)}` : ""}`);
      }
    } catch (error) {
      post(html, "HOTEL_DETAIL_ERROR", { message: error?.publicMessage || error?.message || "Live hotel availability is temporarily unavailable." });
    }
  });
});
