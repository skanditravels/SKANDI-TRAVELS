import wixLocation from "wix-location-frontend";
import { session } from "wix-storage";
import { SITE_MAP, isSafeInternalRoute } from "public/siteMap.js";
import {
  searchLiveCars as searchDuffelCars,
  quoteCar as quoteDuffelCar,
  createCarComponentClientKey as createDuffelComponentClientKey,
  createCarCart,
  loadBookingCart,
  saveCarDriver,
  prepareCarCheckout,
  commitCarBooking,
  loadCustomerCarBooking as getCustomerDuffelCarBooking,
  cancelCustomerCarBooking as cancelCustomerDuffelCarBooking
} from "backend/SKANDI_CORE/customerBooking.web";


let currentCartId = "";
const mutations = new Set();
function setCartId(value) {
  currentCartId = String(value || "");
  if (currentCartId) session.setItem("SKANDI_CAR_CART_ID", currentCartId);
}
function cartAccess(payload = {}) {
  const cartId = payload.cartId || currentCartId;
  if (!cartId) throw new Error("Open this rental through your owned SKANDI booking cart.");
  return { ...payload, cartId: String(cartId) };
}
async function ensureCarCart(payload = {}) {
  if (payload.cartId) { setCartId(payload.cartId); return currentCartId; }
  if (currentCartId) {
    const cart = await loadBookingCart({ cartId: currentCartId });
    if (!payload.quoteId || cart.carQuote?.id === payload.quoteId) return currentCartId;
  }
  if (!payload.quoteId) throw new Error("Select a current rental quote before booking.");
  const created = await createCarCart({ quoteId: payload.quoteId });
  setCartId(created.cartId);
  return currentCartId;
}
async function createCustomerDuffelCarBooking(payload = {}) {
  await ensureCarCart(payload);
  const access = cartAccess(payload);
  await saveCarDriver(access);
  await prepareCarCheckout(access);
  return commitCarBooking(access);
}


const EMBED_ID = "#carRentalEmbed";
const CHILD_SOURCE = "SKANDI_CAR_RENTAL";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";


function post(html, type, payload = {}) { html.postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() }); }
function errorPayload(error) { return { code: String(error?.code || "CAR_RENTAL_ERROR"), message: error?.publicMessage || error?.message || "The car-rental request could not be completed." }; }


$w.onReady(() => {
  setCartId(wixLocation.query.cartId || session.getItem("SKANDI_CAR_CART_ID") || "");
  const html = $w(EMBED_ID);
  html.onMessage(async event => {
    const message = event.data || {};
    if (message.source !== CHILD_SOURCE) return;
    const payload = message.payload || {};
    const mutating = ["CAR_RENTAL_BOOK", "CAR_RENTAL_CANCEL_BOOKING", "CAR_RENTAL_CREATE_CART", "CAR_RENTAL_SAVE_DRIVER", "CAR_RENTAL_PREPARE_CHECKOUT"].includes(message.type);
    if (mutating && mutations.size) return;
    if (mutating) mutations.add(message.type);
    try {
      if (message.type === "CAR_RENTAL_READY") {
        post(html, "CAR_RENTAL_BOOTSTRAP", {
          supplier: "DUFFEL_CARS",
          cartId: currentCartId,
          homePath: SITE_MAP.home,
          bookingId: wixLocation.query.bookingId || "",
          search: {
            pickupLocationText: wixLocation.query.pickup || wixLocation.query.destination || wixLocation.query.destinationSlug || "",
            dropoffLocationText: wixLocation.query.dropoff || wixLocation.query.pickup || wixLocation.query.destination || wixLocation.query.destinationSlug || "",
            pickupDate: wixLocation.query.pickupDate || wixLocation.query.departureDate || "",
            dropoffDate: wixLocation.query.dropoffDate || wixLocation.query.returnDate || "",
            pickupTime: wixLocation.query.pickupTime || "10:00",
            dropoffTime: wixLocation.query.dropoffTime || "10:00",
            residenceCountry: wixLocation.query.residenceCountry || "US",
            driverAge: Number(wixLocation.query.driverAge || 30)
          }
        });
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
          instructions: "Complete any required card authorization through the secure supplier payment form."
        });
        return;
      }
      if (message.type === "CAR_RENTAL_CREATE_CART") {
        await ensureCarCart(payload);
        post(html, "CAR_RENTAL_CART_CREATED", { cartId: currentCartId });
        return;
      }
      if (message.type === "CAR_RENTAL_SAVE_DRIVER") {
        post(html, "CAR_RENTAL_DRIVER_SAVED", await saveCarDriver(cartAccess(payload)));
        return;
      }
      if (message.type === "CAR_RENTAL_PREPARE_CHECKOUT") {
        post(html, "CAR_RENTAL_CHECKOUT_READY", await prepareCarCheckout(cartAccess(payload)));
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
        const result = await getCustomerDuffelCarBooking(cartAccess({ ...payload, bookingId: payload.bookingId || payload.supplierBookingId }));
        post(html, "CAR_RENTAL_LOOKUP_RESULT", result);
        return;
      }
      if (message.type === "CAR_RENTAL_CANCEL_BOOKING") {
        const result = await cancelCustomerDuffelCarBooking(cartAccess({ ...payload, bookingId: payload.bookingId || payload.supplierBookingId }));
        post(html, "CAR_RENTAL_CANCEL_RESULT", result);
        return;
      }
      if (message.type === "CAR_RENTAL_NAVIGATE" && payload.path) {
        if (!isSafeInternalRoute(payload.path)) throw new Error("Invalid navigation destination.");
        wixLocation.to(payload.path);
      }
    } catch (error) {
      post(html, "CAR_RENTAL_ERROR", errorPayload(error));
    } finally {
      if (mutating) mutations.delete(message.type);
    }
  });
});
