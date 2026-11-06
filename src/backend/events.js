import { fulfillPaidStoreGiftCardsCore } from "backend/SKANDI_CORE/storeGiftCards";

export async function wixEcom_onOrderPaymentStatusUpdated(event) {
  const order = event?.data?.order;
  if (order?.paymentStatus !== "PAID") return;
  try {
    await fulfillPaidStoreGiftCardsCore(order);
  } catch (error) {
    console.error("[Store Gift Cards] Paid order fulfillment failed", { orderId: order._id, message: error?.message });
    throw error;
  }
}
