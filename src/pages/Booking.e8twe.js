import wixLocation from "wix-location";
import { session } from "wix-storage";

import {
  getBookingCart,
  saveOfferDecision,
  getBookingExtras,
  saveBookingExtras,
  getSignatureTransferOptions,
  saveSignatureTransfer,
  savePassengerApisAndReprice,
  bookingHasFlight,
  authorizePaymentAndCommitBooking
} from "src/backend/bookingOrchestrator.web";

import {
  getApisRulesForCart,
  refreshTravelRequirements
} from "src/backend/bookingApisRules.web";

import {
  getSeatmapForCart,
  saveSeatSelections
} from "src/backend/bookingSeats.web";

import {
  getSourceAwareBookingConfirmation,
  getTravelDocumentsForCart
} from "src/backend/bookingDocuments.web";

/**
 * SKANDI /booking multi-state controller
 *
 * /home remains a separate Wix page and keeps #home.
 *
 * This page controls the booking steps AFTER search:
 *   /booking?step=offer&cartId=...
 *   /booking?step=extras&cartId=...
 *   /booking?step=transfer&cartId=...
 *   /booking?step=apis&cartId=...
 *   /booking?step=seats&cartId=...
 *   /booking?step=payment&cartId=...
 *   /booking?step=confirmation&cartId=...
 *   /booking?step=documents&cartId=...
 *
 * Wix setup on /booking:
 * - Multi-State Box ID: #bookingFlowStates
 * - State IDs:
statePayment
 * - HTML embeds keep their original IDs:
 *     #seatmapEmbed
 *     #paymentEmbed
 */

const STATEBOX_ID = "#bookingFlowStates";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

const STEPS = {
  offer: {
    state: "stateOffer",
    embed: "#bookingOfferEmbed",
    source: "SKANDI_BOOKING_OFFER"
  },
  extras: {
    state: "stateExtras",
    embed: "#bookingExtrasEmbed",
    source: "SKANDI_BOOKING_EXTRAS"
  },
  transfer: {
    state: "stateTransfer",
    embed: "#signatureTransferEmbed",
    source: "SKANDI_SIGNATURE_TRANSFER"
  },
  apis: {
    state: "stateApis",
    embed: "#apisHtml",
    source: "SKANDI_BOOKING_APIS_V2"
  },
  seats: {
    state: "stateSeats",
    embed: "#seatmapEmbed",
    source: "SKANDI_BOOKING_SEATMAP"
  },
  payment: {
    state: "statePayment",
    embed: "#paymentEmbed",
    source: "SKANDI_BOOKING_PAYMENT"
  },
  confirmation: {
    state: "stateConfirmation",
    embed: "#confirmationEmbed",
    source: "SKANDI_BOOKING_CONFIRMATION_V2"
  },
  documents: {
    state: "stateDocuments",
    embed: "#bookingDocumentsEmbed",
    source: "SKANDI_BOOKING_DOCUMENTS"
  }
};

const SOURCE_TO_STEP = Object.keys(STEPS).reduce((acc, step) => {
  acc[STEPS[step].source] = step;
  return acc;
}, {});

let embeds = {};
let currentStep = "offer";
let cartId = "";

$w.onReady(function () {
  cartId = wixLocation.query.cartId || session.getItem("SKANDI_BOOKING_CART_ID") || "";
  currentStep = normalizeStep(wixLocation.query.step || "offer");

  if (String(wixLocation.query.step || "").toLowerCase() === "home") {
    wixLocation.to("/home");
    return;
  }

  bindEmbeds();
  goStep(currentStep, { silentUrl: true, reason: "initial-load" });
});

function getElement(selector) {
  try {
    return $w(selector);
  } catch (error) {
    return null;
  }
}

function bindEmbeds() {
  Object.keys(STEPS).forEach((step) => {
    const el = getElement(STEPS[step].embed);
    if (!el) {
      console.warn(`Missing booking embed ${STEPS[step].embed} for step ${step}`);
      return;
    }

    embeds[step] = el;
    el.onMessage(handleBookingMessage);
  });
}

function normalizeStep(step) {
  const value = String(step || "").toLowerCase();
  return STEPS[value] ? value : "offer";
}

function setCartId(value) {
  if (!value) return;
  cartId = String(value);
  session.setItem("SKANDI_BOOKING_CART_ID", cartId);
}

function getCartId(msg) {
  const value =
    msg.cartId ||
    msg.payload?.cartId ||
    wixLocation.query.cartId ||
    cartId ||
    session.getItem("SKANDI_BOOKING_CART_ID");

  if (value) setCartId(value);
  return value;
}

function postToStep(step, type, payload = {}, extra = {}) {
  const html = embeds[step];
  if (!html) return;

  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    ...extra
  });
}

function postError(step, message, extra = {}) {
  postToStep(step, "BOOKING_ERROR", {}, {
    message: message || "Booking step failed.",
    ...extra
  });
}

function changeStatebox(step) {
  const box = getElement(STATEBOX_ID);
  const stateId = STEPS[step]?.state || STEPS.offer.state;

  if (!box || !box.changeState) return;

  try {
    const result = box.changeState(stateId);
    if (result && result.catch) result.catch(() => {});
  } catch (error) {
    console.warn("Could not change booking state", stateId, error);
  }
}

function updateBookingUrl(step, extraQuery = {}) {
  const query = { step, ...extraQuery };
  if (cartId) query.cartId = cartId;

  if (wixLocation.queryParams && wixLocation.queryParams.add) {
    try {
      wixLocation.queryParams.add(query);
      return;
    } catch (error) {
      // Fallback below.
    }
  }

  const qs = Object.keys(query)
    .filter((key) => query[key] !== undefined && query[key] !== null && String(query[key]) !== "")
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
    .join("&");

  wixLocation.to(`/booking${qs ? `?${qs}` : ""}`);
}

function goStep(step, options = {}) {
  const next = normalizeStep(step);
  currentStep = next;
  changeStatebox(next);

  if (!options.silentUrl) {
    updateBookingUrl(next, options.query || {});
  }
}

function stepFromPath(path) {
  const p = String(path || "").toLowerCase();

  if (p === "/home" || p === "/") return "home";
  if (p.includes("/booking/offer")) return "offer";
  if (p.includes("/booking/extras")) return "extras";
  if (p.includes("/booking/transfer")) return "transfer";
  if (p.includes("/booking/apis")) return "apis";
  if (p.includes("/booking/seats")) return "seats";
  if (p.includes("/booking/payment") || p === "/payment") return "payment";
  if (p.includes("/booking/confirmation") || p === "/confirmation") return "confirmation";
  if (p.includes("/booking/documents")) return "documents";

  return "";
}

async function handleBookingMessage(event) {
  const msg = event.data || {};
  const step = SOURCE_TO_STEP[msg.source];

  if (!step) return;

  try {
    if (step === "offer") await handleOffer(msg);
    else if (step === "extras") await handleExtras(msg);
    else if (step === "transfer") await handleTransfer(msg);
    else if (step === "apis") await handleApis(msg);
    else if (step === "seats") await handleSeats(msg);
    else if (step === "payment") await handlePayment(msg);
    else if (step === "confirmation") await handleConfirmation(msg);
    else if (step === "documents") await handleDocuments(msg);

    handleGenericNavigate(msg);
  } catch (error) {
    postError(step, error.message || "Booking step failed.");
  }
}

async function handleOffer(msg) {
  const activeCartId = getCartId(msg);

  if (msg.type === "BOOKING_OFFER_READY") {
    const cart = await getBookingCart({ cartId: activeCartId });
    postToStep("offer", "BOOKING_CART_LOADED", { cart });
    return;
  }

  if (msg.type === "BOOKING_OFFER_ACCEPTED") {
    await saveOfferDecision({
      cartId: activeCartId,
      termsAccepted: msg.termsAccepted === true
    });

    goStep("extras", { reason: "offer-accepted" });
  }
}

async function handleExtras(msg) {
  const activeCartId = getCartId(msg);

  if (msg.type === "BOOKING_EXTRAS_READY") {
    const payload = await getBookingExtras({ cartId: activeCartId });
    postToStep("extras", "BOOKING_EXTRAS_LOADED", payload);
    return;
  }

  if (msg.type === "BOOKING_EXTRAS_SAVE") {
    const result = await saveBookingExtras({
      cartId: activeCartId,
      selectedExtras: msg.selectedExtras || []
    });

    goStep(result.requiresSignatureTransfer ? "transfer" : "apis", {
      reason: "extras-saved"
    });
  }
}

async function handleTransfer(msg) {
  const activeCartId = getCartId(msg);

  if (msg.type === "SIGNATURE_TRANSFER_READY") {
    const payload = await getSignatureTransferOptions({ cartId: activeCartId });
    postToStep("transfer", "SIGNATURE_TRANSFER_OPTIONS", payload);
    return;
  }

  if (msg.type === "SIGNATURE_TRANSFER_SELECT") {
    await saveSignatureTransfer({
      cartId: activeCartId,
      transfer: msg.transfer || null
    });

    goStep("apis", { reason: "transfer-selected" });
    return;
  }

  if (msg.type === "SIGNATURE_TRANSFER_SKIP") {
    await saveSignatureTransfer({ cartId: activeCartId, transfer: null });
    goStep("apis", { reason: "transfer-skipped" });
  }
}

async function handleApis(msg) {
  const activeCartId = getCartId(msg);

  if (msg.type === "APIS_HTML_READY") {
    const [cart, rules] = await Promise.all([
      getBookingCart({ cartId: activeCartId }),
      getApisRulesForCart({ cartId: activeCartId })
    ]);

    postToStep("apis", "APIS_CART_RULES_LOADED", { cart, rules });
    return;
  }

  if (msg.type === "APIS_RULES_REFRESH") {
    const rules = await refreshTravelRequirements({
      cartId: activeCartId,
      travelers: msg.travelers || []
    });

    postToStep("apis", "APIS_REQUIREMENTS_RESULT", { rules });
    return;
  }

  if (msg.type === "APIS_SAVE_AND_CONTINUE") {
    await savePassengerApisAndReprice({
      cartId: activeCartId,
      travelers: msg.travelers || [],
      contact: msg.contact || {}
    });

    const hasFlight = await bookingHasFlight({ cartId: activeCartId });

    goStep(hasFlight ? "seats" : "payment", {
      reason: "apis-saved"
    });
  }
}

async function handleSeats(msg) {
  const activeCartId = getCartId(msg);

  if (msg.type === "SEATMAP_READY") {
    const payload = await getSeatmapForCart({ cartId: activeCartId });
    postToStep("seats", "SEATMAP_LOADED", payload);
    return;
  }

  if (msg.type === "SEATMAP_SAVE") {
    await saveSeatSelections({
      cartId: activeCartId,
      selections: msg.selections || {}
    });

    goStep("payment", { reason: "seats-saved" });
    return;
  }

  if (msg.type === "SEATMAP_SKIP") {
    await saveSeatSelections({
      cartId: activeCartId,
      selections: {},
      skipped: true
    });

    goStep("payment", { reason: "seats-skipped" });
  }
}

async function handlePayment(msg) {
  const activeCartId = getCartId(msg);

  if (msg.type === "PAYMENT_READY") {
    const cart = await getBookingCart({ cartId: activeCartId });
    postToStep("payment", "PAYMENT_CART_LOADED", { cart });
    return;
  }

  if (msg.type === "PAYMENT_COMMIT") {
    postToStep("payment", "PAYMENT_PROGRESS", {}, {
      message: "Authorizing payment..."
    });

    const result = await authorizePaymentAndCommitBooking({
      cartId: activeCartId,
      termsAccepted: msg.termsAccepted === true
    });

    goStep("confirmation", {
      reason: "payment-committed",
      query: { ref: result.bookingReference || "" }
    });
  }
}

async function handleConfirmation(msg) {
  const activeCartId = getCartId(msg);

  if (msg.type === "CONFIRMATION_READY") {
    const confirmation = await getSourceAwareBookingConfirmation({ cartId: activeCartId });
    postToStep("confirmation", "CONFIRMATION_LOADED", { confirmation });
    return;
  }

  if (msg.type === "CONFIRMATION_NAVIGATE" && msg.path) {
    const step = stepFromPath(msg.path);

    if (step === "home") {
      wixLocation.to("/home");
      return;
    }

    if (step) {
      goStep(step, { reason: "confirmation-navigate" });
      return;
    }

    wixLocation.to(msg.path);
  }
}

async function handleDocuments(msg) {
  const activeCartId = getCartId(msg);

  if (msg.type === "BOOKING_DOCUMENTS_READY") {
    const payload = await getTravelDocumentsForCart({ cartId: activeCartId });
    postToStep("documents", "BOOKING_DOCUMENTS_LOADED", payload);
  }
}

function handleGenericNavigate(msg) {
  if (msg.type !== "BOOKING_NAVIGATE" || !msg.path) return;

  const step = stepFromPath(msg.path);

  if (step === "home") {
    wixLocation.to("/home");
    return;
  }

  if (step) {
    goStep(step, { reason: "generic-navigate" });
    return;
  }

  wixLocation.to(msg.path);
}
