// V12 Store confirmation. The URL identifies the order; Wix verifies ownership and status.
import wixLocationFrontend from "wix-location-frontend";
import { isSafeInternalRoute } from "public/siteMap";
import { getStoreOrderConfirmation } from "backend/SKANDI_CORE/storeCheckout.web";
const SOURCE = "SKANDI_STORE_CONFIRMATION";
let embed, loading = null;
function send(type, payload = {}) { embed.postMessage({ source: "SKANDI_WIX_PARENT", type, payload, timestamp: new Date().toISOString() }); }
async function load() {
  if (loading) return loading;
  loading = (async () => {
    send("STORE_CONFIRMATION_LOADING");
    try {
      const order = await getStoreOrderConfirmation({ orderId: String(wixLocationFrontend.query?.orderId || "") });
      if (!order?.ok || !order.verified) throw new Error("Order status is unavailable.");
      send("STORE_CONFIRMATION_DATA", order);
    } catch (_) { send("STORE_CONFIRMATION_ERROR", { message: "We could not verify this order in your current session. Retry, or open My Orders after signing in." }); }
  })().finally(() => { loading = null; });
  return loading;
}
$w.onReady(() => {
  embed = $w("#storeOrderConfirmationEmbed");
  embed.onMessage(event => {
    let message = event?.data;
    if (typeof message === "string") { try { message = JSON.parse(message); } catch (_) { return; } }
    if (message?.source !== SOURCE) return;
    if (["CONFIRMATION_READY", "CONFIRMATION_REFRESH"].includes(message.type)) { void load(); return; }
    if (message.type === "CONFIRMATION_NAVIGATE" && isSafeInternalRoute(message.payload?.path)) wixLocationFrontend.to(message.payload.path);
  });
  send("STORE_CONFIRMATION_PARENT_READY", { version: "V12" });
});
