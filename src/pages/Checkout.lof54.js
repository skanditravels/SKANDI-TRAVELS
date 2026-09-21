import wixLocationFrontend from "wix-location-frontend";
import wixPayFrontend from "wix-pay-frontend";

import {
  getStoreCheckoutBootstrap,
  saveStoreCheckoutDetails,
  setStoreDeliveryMethod,
  applyStoreCoupon,
  removeStoreCoupon,
  updateStoreCartLineItem,
  removeStoreCartLineItem,
  prepareStorePayment
} from "backend/storeCheckout.web";

const EMBED_ID =
  "#storeCheckoutEmbed";

const CHECKOUT_SOURCE =
  "SKANDI_STORE_CHECKOUT";

const PARENT_SOURCE =
  "SKANDI_WIX_PARENT";

const CONFIRMATION_PATH =
  "/the-store/order-confirmation";

let embed = null;

/*
 * Prevent duplicate Place Order calls if a customer closes
 * the payment window and then retries.
 */
let pendingPayment = null;

function parseMessage(value) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (_) {
      return null;
    }
  }

  return value && typeof value === "object"
    ? value
    : null;
}

function send(type, payload = {}) {
  if (!embed) {
    return;
  }

  embed.postMessage({
    source:
      PARENT_SOURCE,
    type,
    payload,
    timestamp:
      new Date().toISOString()
  });
}

async function pushState(statePromise) {
  const state =
    await statePromise;

  send(
    "CHECKOUT_STATE",
    state
  );

  return state;
}

function confirmationUrl(
  orderId,
  paymentStatus = ""
) {
  const params =
    new URLSearchParams();

  if (orderId) {
    params.set(
      "orderId",
      orderId
    );
  }

  if (paymentStatus) {
    params.set(
      "paymentStatus",
      paymentStatus
    );
  }

  const query =
    params.toString();

  return (
    CONFIRMATION_PATH +
    (
      query
        ? `?${query}`
        : ""
    )
  );
}

async function runSecurePayment(payment) {
  if (!payment?.paymentGatewayOrderId) {
    wixLocationFrontend.to(
      confirmationUrl(
        payment?.orderId ||
        "",
        "completed"
      )
    );
    return;
  }

  send(
    "CHECKOUT_PROGRESS",
    {
      message:
        "Opening secure payment…"
    }
  );

  try {
    const result =
      await wixPayFrontend
        .startPayment(
          payment
            .paymentGatewayOrderId,

          {
            showThankYouPage:
              false
          }
        );

    const status =
      String(
        result?.status ||
        ""
      ).trim();

    const normalized =
      status.toLowerCase();

    /*
     * Frontend payment result is used only for UX routing.
     * Wix remains the source of truth for payment/order state.
     */
    if (
      normalized.includes("success") ||
      normalized.includes("pending")
    ) {
      const orderId =
        payment.orderId ||
        "";

      pendingPayment = null;

      wixLocationFrontend.to(
        confirmationUrl(
          orderId,
          status ||
          "submitted"
        )
      );
      return;
    }

    send(
      "CHECKOUT_PAYMENT_STATUS",
      {
        status:
          status ||
          "Payment not completed",

        retryAvailable:
          true
      }
    );
  } catch (error) {
    console.warn(
      "[SKANDI Checkout] Secure payment did not complete.",
      error
    );

    send(
      "CHECKOUT_PAYMENT_STATUS",
      {
        status:
          "Payment was not completed.",

        retryAvailable:
          true
      }
    );
  }
}

async function submitCheckout(payload = {}) {
  send(
    "CHECKOUT_PROGRESS",
    {
      message:
        "Checking your order…"
    }
  );

  if (
    pendingPayment
      ?.paymentGatewayOrderId
  ) {
    await runSecurePayment(
      pendingPayment
    );
    return;
  }

  const detailsState =
    await saveStoreCheckoutDetails({
      customer:
        payload.customer ||
        {},

      address:
        payload.address ||
        {},

      note:
        payload.note ||
        ""
    });

  send(
    "CHECKOUT_STATE",
    detailsState
  );

  const delivery =
    payload.deliveryMethod ||
    {};

  if (delivery.code) {
    const deliveryState =
      await setStoreDeliveryMethod({
        code:
          delivery.code,

        appId:
          delivery.appId ||
          ""
      });

    send(
      "CHECKOUT_STATE",
      deliveryState
    );
  }

  const result =
    await prepareStorePayment();

  if (!result?.ok) {
    if (result?.state) {
      send(
        "CHECKOUT_STATE",
        result.state
      );
    }

    throw new Error(
      result?.message ||
      "Please review your checkout details."
    );
  }

  if (result.completed === true) {
    wixLocationFrontend.to(
      confirmationUrl(
        result.orderId,
        "completed"
      )
    );
    return;
  }

  if (result.paymentGatewayOrderId) {
    pendingPayment = {
      orderId:
        result.orderId,

      paymentGatewayOrderId:
        result
          .paymentGatewayOrderId
    };

    await runSecurePayment(
      pendingPayment
    );
    return;
  }

  wixLocationFrontend.to(
    confirmationUrl(
      result.orderId,
      "submitted"
    )
  );
}

async function handleMessage(message) {
  const payload =
    message.payload ||
    {};

  switch (message.type) {
    case "CHECKOUT_READY":
    case "CHECKOUT_REFRESH":
      await pushState(
        getStoreCheckoutBootstrap()
      );
      return;

    case "CHECKOUT_SAVE_DETAILS":
      await pushState(
        saveStoreCheckoutDetails({
          customer:
            payload.customer ||
            {},

          address:
            payload.address ||
            {},

          note:
            payload.note ||
            ""
        })
      );
      return;

    case "CHECKOUT_SET_DELIVERY":
      await pushState(
        setStoreDeliveryMethod({
          code:
            payload.code,

          appId:
            payload.appId ||
            ""
        })
      );
      return;

    case "CHECKOUT_APPLY_COUPON":
      await pushState(
        applyStoreCoupon({
          code:
            payload.code
        })
      );
      return;

    case "CHECKOUT_REMOVE_COUPON":
      await pushState(
        removeStoreCoupon({
          couponId:
            payload.couponId
        })
      );
      return;

    case "CHECKOUT_UPDATE_QTY":
      await pushState(
        updateStoreCartLineItem({
          lineItemId:
            payload.lineItemId,

          quantity:
            payload.quantity
        })
      );
      return;

    case "CHECKOUT_REMOVE_ITEM":
      await pushState(
        removeStoreCartLineItem({
          lineItemId:
            payload.lineItemId
        })
      );
      return;

    case "CHECKOUT_SUBMIT":
      await submitCheckout(
        payload
      );
      return;

    case "CHECKOUT_NAVIGATE":
      if (payload.path) {
        wixLocationFrontend.to(
          payload.path
        );
      }
      return;

    default:
      return;
  }
}

$w.onReady(function () {
  embed =
    $w(
      EMBED_ID
    );

  embed.onMessage(
    async (event) => {
      const message =
        parseMessage(
          event.data
        );

      if (
        !message ||
        message.source !==
          CHECKOUT_SOURCE
      ) {
        return;
      }

      try {
        await handleMessage(
          message
        );
      } catch (error) {
        console.error(
          `[SKANDI Checkout] ${message.type} failed.`,
          error
        );

        send(
          "CHECKOUT_ERROR",
          {
            message:
              error?.message ||
              "We could not complete that checkout action."
          }
        );
      }
    }
  );

  send(
    "CHECKOUT_PARENT_READY",
    {
      embedId:
        EMBED_ID,

      cartVersion:
        "V2",

      customCheckout:
        true
    }
  );

  void pushState(
    getStoreCheckoutBootstrap()
  ).catch(
    (error) => {
      send(
        "CHECKOUT_ERROR",
        {
          message:
            error?.message ||
            "Your shopping bag could not be loaded."
        }
      );
    }
  );
});
