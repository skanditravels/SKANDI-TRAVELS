// V12 custom Store checkout: /the-store/store-checkout, #storeCheckoutEmbed.
// This controller belongs to qofcb; lof54 is the separate Wix app checkout page.
import wixLocationFrontend from "wix-location-frontend";
import wixPayFrontend from "wix-pay-frontend";
import { session } from "wix-storage-frontend";
import { SITE_MAP, isSafeInternalRoute } from "public/siteMap";
import { getStoreCheckoutBootstrap, saveStoreCheckoutDetails, setStoreDeliveryMethod, applyStoreCoupon, removeStoreCoupon, updateStoreCartLineItem, removeStoreCartLineItem, prepareStorePayment, getStoreOrderConfirmation } from "backend/SKANDI_CORE/storeCheckout.web";
const SOURCE = "SKANDI_STORE_CHECKOUT";
const PAYMENT_KEY = "SKANDI_STORE_PENDING_PAYMENT";
let embed, state, running = false, bootstrapPromise = null, pendingPayment = null;
function parse(value) { try { return typeof value === "string" ? JSON.parse(value) : value; } catch (_) { return null; } }
function send(type, payload = {}) { embed.postMessage({ source: "SKANDI_WIX_PARENT", type, payload, timestamp: new Date().toISOString() }); }
function remember(payment) {
  pendingPayment = payment;
  try { if (payment) session.setItem(PAYMENT_KEY, JSON.stringify(payment)); else session.removeItem(PAYMENT_KEY); } catch (_) { /* The same-order retry remains available in this page session. */ }
}
function confirm(orderId) { wixLocationFrontend.to(`${SITE_MAP.storeConfirmation}?orderId=${encodeURIComponent(orderId)}`); }
async function push(promise, busy = false) {
  const result = await promise;
  if (!result || result.ok === false) throw new Error(result?.message || "Checkout could not be loaded.");
  state = result;
  send("CHECKOUT_STATE", { ...state, busy, pendingPayment: Boolean(pendingPayment), pendingOrderId: pendingPayment?.orderId || "" });
  return state;
}
async function bootstrap() {
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = (async () => {
    if (pendingPayment?.orderId) {
      // Verify ownership and payment state before offering a persisted payment retry.
      const order = await getStoreOrderConfirmation({ orderId: pendingPayment.orderId });
      if (order.paymentStatus === "PAID" || ["CANCELED", "REJECTED"].includes(order.status)) { remember(null); confirm(order.orderId); return; }
    }
    const result = await push(getStoreCheckoutBootstrap());
    if (result.orderPlaced && result.orderId && !pendingPayment) confirm(result.orderId);
  })().finally(() => { bootstrapPromise = null; });
  return bootstrapPromise;
}
async function runSecurePayment(payment) {
  if (!payment?.paymentGatewayOrderId || !payment?.orderId) throw new Error("Payment could not be opened. Check My Orders before trying again.");
  send("CHECKOUT_PROGRESS", { message: "Opening secure payment…" });
  try {
    const result = await wixPayFrontend.startPayment(payment.paymentGatewayOrderId, { showThankYouPage: false });
    const status = String(result?.status || "");
    if (["successful", "pending", "offline"].includes(status.toLowerCase())) {
      const id = payment.orderId; remember(null); confirm(id); return;
    }
    send("CHECKOUT_PAYMENT_STATUS", { status: status || "Payment was not completed.", retryAvailable: true, pendingPayment: true });
  } catch (_) {
    send("CHECKOUT_PAYMENT_STATUS", { status: "Payment was not completed. Retry payment for the same order.", retryAvailable: true, pendingPayment: true });
  }
}
async function submit(payload) {
  if (pendingPayment) { await runSecurePayment(pendingPayment); return; }
  if (state?.orderPlaced) { if (state.orderId) confirm(state.orderId); return; }
  const reviewedToken = state?.summary?.priceVerificationToken;
  send("CHECKOUT_PROGRESS", { message: "Checking your order…" });
  await push(saveStoreCheckoutDetails({ customer: payload.customer || {}, address: payload.address || {}, note: payload.note || "" }), true);
  if (payload.deliveryMethod?.code) await push(setStoreDeliveryMethod(payload.deliveryMethod), true);
  const result = await prepareStorePayment({ priceVerificationToken: reviewedToken });
  if (!result?.ok) { if (result?.state) await push(Promise.resolve(result.state)); throw new Error(result?.message || "Review your order before continuing."); }
  if (result.completed || result.alreadyPlaced || result.submitted) { confirm(result.orderId); return; }
  if (!result.paymentGatewayOrderId) throw new Error("Secure payment is unavailable. Check My Orders before retrying.");
  remember({ orderId: result.orderId, paymentGatewayOrderId: result.paymentGatewayOrderId, createdAt: Date.now() });
  send("CHECKOUT_STATE", { ...state, busy: true, pendingPayment: true, pendingOrderId: result.orderId });
  await runSecurePayment(pendingPayment);
}
async function handle(type, p) {
  if (type === "CHECKOUT_READY" || type === "CHECKOUT_REFRESH") { await bootstrap(); return; }
  if (type === "CHECKOUT_NAVIGATE") { if (isSafeInternalRoute(p.path)) wixLocationFrontend.to(p.path); return; }
  if (type === "CHECKOUT_SUBMIT") { await submit(p); return; }
  if (pendingPayment || state?.orderPlaced) throw new Error("This order has already been submitted. Complete its payment or review it in My Orders.");
  switch (type) {
    case "CHECKOUT_SAVE_DETAILS": await push(saveStoreCheckoutDetails(p)); break;
    case "CHECKOUT_SET_DELIVERY": await push(setStoreDeliveryMethod(p)); break;
    case "CHECKOUT_APPLY_COUPON": await push(applyStoreCoupon(p)); break;
    case "CHECKOUT_REMOVE_COUPON": await push(removeStoreCoupon(p)); break;
    case "CHECKOUT_UPDATE_QTY": await push(updateStoreCartLineItem(p)); break;
    case "CHECKOUT_REMOVE_ITEM": await push(removeStoreCartLineItem(p)); break;
  }
}
$w.onReady(() => {
  embed = $w("#storeCheckoutEmbed");
  const saved = parse(session.getItem(PAYMENT_KEY));
  if (saved?.orderId && saved?.paymentGatewayOrderId) pendingPayment = saved;
  embed.onMessage(async event => {
    const message = parse(event.data);
    if (message?.source !== SOURCE) return;
    if (running) return;
    running = true;
    try { await handle(message.type, message.payload || {}); }
    catch (error) { send("CHECKOUT_ERROR", { message: error?.message || "Checkout is unavailable. Please try again." }); }
    finally { running = false; }
  });
  send("CHECKOUT_PARENT_READY", { version: "V12", cartVersion: "V2", customCheckout: true });
});
