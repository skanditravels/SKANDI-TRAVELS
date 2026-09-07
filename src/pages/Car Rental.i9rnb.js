import wixLocation from "wix-location-frontend";
import {
  searchDuffelCars,
  quoteDuffelCar,
  createDuffelComponentClientKey,
  createCustomerDuffelCarBooking,
  getCustomerDuffelCarBooking,
  cancelCustomerDuffelCarBooking
} from "backend/RIA/duffelGroundProducts.web";

const EMBED_ID = "#carRentalEmbed";
const CHILD_SOURCE = "SKANDI_CAR_RENTAL";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function post(html, type, payload = {}) { html.postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() }); }
function errorPayload(error) { return { code: String(error?.code || "CAR_RENTAL_ERROR"), message: error?.publicMessage || error?.message || "The car-rental request could not be completed." }; }

$w.onReady(() => {
  const html = $w(EMBED_ID);
  html.onMessage(async event => {
    const message = event.data || {};
    if (message.source !== CHILD_SOURCE) return;
    const payload = message.payload || {};
    try {
      if (message.type === "CAR_RENTAL_READY") {
        post(html, "CAR_RENTAL_BOOTSTRAP", { supplier: "DUFFEL_CARS", bookingId: wixLocation.query.bookingId || "" });
        return;
      }
      if (message.type === "CAR_RENTAL_SEARCH") {
        const result = await searchDuffelCars(payload.search || payload);
        post(html, "CAR_RENTAL_SEARCH_RESULT", { ...result, offers: result.items || [] });
        return;
      }
      if (["CAR_RENTAL_GET_OFFER", "CAR_RENTAL_REPRICE"].includes(message.type)) {
        const result = await quoteDuffelCar({ rateId: payload.rateId || payload.offerId || payload.id });
        post(html, message.type === "CAR_RENTAL_REPRICE" ? "CAR_RENTAL_REPRICE_RESULT" : "CAR_RENTAL_OFFER_RESULT", result);
        return;
      }
      if (message.type === "CAR_RENTAL_PREPARE_SUPPLIER_PAYMENT") {
        const key = await createDuffelComponentClientKey();
        post(html, "CAR_RENTAL_SUPPLIER_PAYMENT_READY", {
          ...key,
          quoteId: payload.quoteId || "",
          instructions: "Use DuffelCardForm and createThreeDSecureSession in the secure checkout surface. Raw card data must never be posted to Wix or SKANDI backend code."
        });
        return;
      }
      if (message.type === "CAR_RENTAL_BOOK") {
        const result = await createCustomerDuffelCarBooking({
          ...payload,
          alteaBookingId: payload.alteaBookingId || wixLocation.query.bookingId || ""
        });
        post(html, "CAR_RENTAL_BOOKING_RESULT", result);
        return;
      }
      if (message.type === "CAR_RENTAL_LOOKUP_BOOKING") {
        const result = await getCustomerDuffelCarBooking({ bookingId: payload.bookingId || payload.supplierBookingId, alteaBookingId: payload.alteaBookingId || wixLocation.query.bookingId || "" });
        post(html, "CAR_RENTAL_LOOKUP_RESULT", result);
        return;
      }
      if (message.type === "CAR_RENTAL_CANCEL_BOOKING") {
        const result = await cancelCustomerDuffelCarBooking({ bookingId: payload.bookingId || payload.supplierBookingId, alteaBookingId: payload.alteaBookingId || wixLocation.query.bookingId || "" });
        post(html, "CAR_RENTAL_CANCEL_RESULT", result);
        return;
      }
      if (message.type === "CAR_RENTAL_NAVIGATE" && payload.path) {
        wixLocation.to(payload.path);
      }
    } catch (error) {
      post(html, "CAR_RENTAL_ERROR", errorPayload(error));
    }
  });
});
