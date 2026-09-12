// /src/backend/SKANDI_CORE/bookingReconciliation.js
// SKANDI Backend Base 1.0 — B-006 booking/payment reconciliation helpers.
// Never creates a second ALTEA record. Confirmed booking_carts remain the only customer->ALTEA handoff.

import {
  getDuffelOrderByOfferCore,
  getDuffelOrderCore
} from "backend/SKANDI_CORE/duffelAir.js";
import {
  retrieveStripePaymentIntent,
  captureStripePaymentIntent,
  cancelStripePaymentIntent,
  assertStripeAuthorization
} from "backend/SKANDI_CORE/stripeClient.js";
import { updateOwnedCart, recordPaymentEventOnce } from "backend/SKANDI_CORE/bookingCart.js";
import { bookingError } from "backend/SKANDI_CORE/bookingMapper.js";

function nowIso() { return new Date().toISOString(); }

export async function markBookingReconciliationRequired(context, row, details = {}) {
  const payload = {
    ...(row.payload || {}),
    ...(details.airOrder ? { airOrder: details.airOrder } : {}),
    payment: {
      ...(row.payload?.payment || {}),
      status: details.paymentStatus || row.payload?.payment?.status || "authorization_held"
    },
    reconciliation: {
      required: true,
      kind: details.kind || "PROVIDER_OUTCOME_UNKNOWN",
      code: details.code || "BOOKING_RECONCILIATION_REQUIRED",
      providerRequestId: details.providerRequestId || null,
      correlationId: details.correlationId || null,
      providerStatus: details.providerStatus || null,
      supplierOrderId: details.airOrder?.id || details.supplierOrderId || null,
      customerPaymentCaptureRequired: details.customerPaymentCaptureRequired === true,
      createdAt: nowIso()
    },
    flow: { ...(row.payload?.flow || {}), currentStep: "payment" }
  };
  return updateOwnedCart(context, row.cart_id, { status: "ReconciliationRequired", payload });
}

export async function voidUnusedAuthorization(row) {
  const paymentIntentId = row?.payload?.payment?.paymentIntentId;
  if (!paymentIntentId) return null;
  try {
    const intent = await retrieveStripePaymentIntent(paymentIntentId);
    if (["requires_capture", "requires_payment_method", "requires_confirmation", "requires_action"].includes(String(intent?.status || ""))) {
      return cancelStripePaymentIntent(paymentIntentId, `skandi_void_${row.cart_id}`.slice(0, 255));
    }
    return intent;
  } catch (_) {
    return null;
  }
}

export async function reconcileFlightCart(context, row) {
  if (!row?.selected_offer_id) throw bookingError("BOOKING_RECONCILIATION_UNAVAILABLE", "This cart has no airline offer to reconcile.", 409);
  const result = await getDuffelOrderByOfferCore({ offerId: row.selected_offer_id });
  if (!result.order?.id) {
    return { resolved: false, cart: row, message: "No Duffel order is visible for this offer yet." };
  }

  const payment = row.payload?.payment || {};
  if (!payment.paymentIntentId) throw bookingError("PAYMENT_REFERENCE_MISSING", "The customer payment authorization is missing from this booking.", 409);
  const intent = await retrieveStripePaymentIntent(payment.paymentIntentId);
  assertStripeAuthorization(intent, {
    amount: payment.amountMinor,
    currency: payment.currency,
    metadata: { idempotency_context: row.cart_id },
    allowCaptured: true
  });

  let captured = intent;
  if (intent.status === "requires_capture") {
    captured = await captureStripePaymentIntent(payment.paymentIntentId, `skandi_capture_${row.cart_id}`.slice(0, 255));
  }
  if (captured.status !== "succeeded") {
    const updated = await markBookingReconciliationRequired(context, row, {
      kind: "PAYMENT_CAPTURE_REQUIRED",
      code: "PAYMENT_CAPTURE_NOT_COMPLETE",
      airOrder: result.order,
      customerPaymentCaptureRequired: true,
      paymentStatus: captured.status || "capture_pending"
    });
    return { resolved: false, cart: updated, order: result.order };
  }

  const payload = {
    ...(row.payload || {}),
    airOrder: result.order,
    order: result.order,
    bookingReference: result.order.bookingReference || row.cart_id,
    paymentIntentId: payment.paymentIntentId,
    payment: { ...payment, status: "succeeded", capturedAt: nowIso() },
    reconciliation: null,
    flow: { ...(row.payload?.flow || {}), currentStep: "confirmation", confirmedAt: nowIso() }
  };
  const updated = await updateOwnedCart(context, row.cart_id, { status: "Confirmed", payload });
  recordPaymentEventOnce({
    eventId: payment.paymentIntentId,
    provider: "Stripe",
    memberId: context.memberId,
    bookingId: row.cart_id,
    amount: row.total,
    currency: row.currency,
    status: "succeeded",
    payload: { duffelOrderId: result.order.id, bookingReference: result.order.bookingReference }
  }).catch(() => {});
  return { resolved: true, cart: updated, order: result.order };
}

export async function refreshConfirmedAirOrder(context, row) {
  const orderId = row?.payload?.airOrder?.id || row?.payload?.order?.id;
  if (!orderId) return row;
  const result = await getDuffelOrderCore({ orderIdOrReference: orderId });
  return updateOwnedCart(context, row.cart_id, {
    payload: { ...(row.payload || {}), airOrder: result.order, order: result.order }
  });
}
