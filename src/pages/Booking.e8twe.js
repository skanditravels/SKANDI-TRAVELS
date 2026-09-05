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
  prepareBookingPayment,
  authorizePaymentAndCommitBooking
} from "backend/bookingOrchestrator.web";

import {
  getApisRulesForCart,
  refreshTravelRequirements
} from "backend/bookingApisRules.web";

import {
  getSeatmapForCart,
  saveSeatSelections
} from "backend/bookingSeats.web";

import {
  getSourceAwareBookingConfirmation,
  getTravelDocumentsForCart
} from "backend/bookingDocuments.web";

const STATEBOX_ID = "#bookingFlowStates";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

const STEPS = {
  offer: { state: "stateOffer", embed: "#bookingOfferEmbed", source: "SKANDI_BOOKING_OFFER" },
  extras: { state: "stateExtras", embed: "#bookingExtrasEmbed", source: "SKANDI_BOOKING_EXTRAS" },
  transfer: { state: "stateTransfer", embed: "#signatureTransferEmbed", source: "SKANDI_SIGNATURE_TRANSFER" },
  apis: { state: "stateApis", embed: "#apisHtml", source: "SKANDI_BOOKING_APIS_V2" },
  seats: { state: "stateSeats", embed: "#seatmapEmbed", source: "SKANDI_BOOKING_SEATMAP" },
  payment: { state: "statePayment", embed: "#paymentEmbed", source: "SKANDI_BOOKING_PAYMENT" },
  confirmation: { state: "stateConfirmation", embed: "#confirmationEmbed", source: "SKANDI_BOOKING_CONFIRMATION_V2" },
  documents: { state: "stateDocuments", embed: "#bookingDocumentsEmbed", source: "SKANDI_BOOKING_DOCUMENTS" }
};

const SOURCE_TO_STEP = Object.keys(STEPS).reduce((acc, step) => {
  acc[STEPS[step].source] = step;
  return acc;
}, {});

const READY_TYPES = {
  offer: "BOOKING_OFFER_READY",
  extras: "BOOKING_EXTRAS_READY",
  transfer: "SIGNATURE_TRANSFER_READY",
  apis: "APIS_HTML_READY",
  seats: "SEATMAP_READY",
  payment: "PAYMENT_READY",
  confirmation: "CONFIRMATION_READY",
  documents: "BOOKING_DOCUMENTS_READY"
};

const MUTATING_MESSAGE_TYPES = new Set([
  "BOOKING_OFFER_ACCEPTED",
  "BOOKING_EXTRAS_SAVE",
  "SIGNATURE_TRANSFER_SELECT",
  "SIGNATURE_TRANSFER_SKIP",
  "APIS_SAVE_AND_CONTINUE",
  "SEATMAP_SAVE",
  "SEATMAP_SKIP",
  "PAYMENT_COMMIT"
]);

let embeds = {};
let currentStep = "offer";
let cartId = "";
let cartToken = "";
let paymentCommitInFlight = false;
const readyEmbeds = new Set();
const initializedSteps = new Set();
const initializationPromises = new Map();
const actionsInFlight = new Set();

$w.onReady(function () {
  cartId = wixLocation.query.cartId || session.getItem("SKANDI_BOOKING_CART_ID") || "";
  cartToken = wixLocation.query.cartToken || session.getItem("SKANDI_BOOKING_CART_TOKEN") || "";
  if (cartId) setCartId(cartId);
  if (cartToken) setCartToken(cartToken);
  currentStep = normalizeStep(wixLocation.query.step || "offer");

  if (String(wixLocation.query.step || "").toLowerCase() === "home") {
    wixLocation.to("/home");
    return;
  }

  bindEmbeds();
  if (currentStep === "extras" && !embeds.extras) currentStep = "transfer";
  goStep(currentStep, { silentUrl: true, reason: "initial-load" });
});

function getElement(selector) {
  try { return $w(selector); }
  catch (_) { return null; }
}

function bindEmbeds() {
  Object.keys(STEPS).forEach((step) => {
    const el = getElement(STEPS[step].embed);
    if (!el) {
      console.warn(`Missing booking embed ${STEPS[step].embed} for step ${step}`);
      return;
    }
    embeds[step] = el;
    el.onMessage((event) => handleBookingMessage(event, step));
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

function setCartToken(value) {
  if (!value) return;
  cartToken = String(value);
  session.setItem("SKANDI_BOOKING_CART_TOKEN", cartToken);
}

function getCartId(msg = {}) {
  const value = msg.cartId || msg.payload?.cartId || wixLocation.query.cartId || cartId || session.getItem("SKANDI_BOOKING_CART_ID");
  if (value) setCartId(value);
  if (!value) {
    throw new Error("This booking link is missing its cart reference. Return to Home and select a live offer again.");
  }
  return String(value);
}

function getCartToken(msg = {}) {
  const value = msg.cartToken || msg.payload?.cartToken || wixLocation.query.cartToken || cartToken || session.getItem("SKANDI_BOOKING_CART_TOKEN");
  if (value) setCartToken(value);
  if (!value) {
    throw new Error("This booking link is missing its secure cart token. Return to Home and select the offer again.");
  }
  return String(value);
}

function bookingAccess(msg = {}) {
  return { cartId: getCartId(msg), cartToken: getCartToken(msg) };
}

function postToStep(step, type, payload = {}, extra = {}) {
  const html = embeds[step];
  if (!html) return;
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    ...extra,
    timestamp: new Date().toISOString()
  });
}

function postError(step, message, extra = {}) {
  postToStep(step, "BOOKING_ERROR", {}, {
    message: message || "Booking step failed.",
    ...extra
  });
}

function publicBookingError(error) {
  const raw = String(
    error?.publicMessage ||
    error?.message ||
    "The booking request could not be completed."
  ).trim();

  const messages = {
    BOOKING_CART_ACCESS_DENIED: "This secure booking session has expired. Return to Home and select the offer again.",
    BOOKING_CART_NOT_FOUND: "This booking session could not be found. Return to Home and select the offer again.",
    BOOKING_OFFER_EXPIRED: "This flight offer has expired. Search again for a current option.",
    BOOKING_LIVE_OFFER_INVALID: "This flight offer is no longer valid. Search again for a current option.",
    BOOKING_HOTEL_RESULT_INVALID: "This hotel offer is no longer valid. Search again for current availability.",
    BOOKING_HOTEL_RATE_UNAVAILABLE: "This hotel rate is no longer available. Search again for current availability.",
    BOOKING_SEAT_UNAVAILABLE: "That seat is no longer available. Choose another seat or continue without seats.",
    BOOKING_SEATMAP_UNAVAILABLE: "Seat selection is not available for this flight right now.",
    BOOKING_PAYMENT_NOT_COMPLETE: "Payment has not completed yet. Check the payment status before retrying.",
    BOOKING_PAYMENT_AMOUNT_MISMATCH: "The booking price changed after payment was prepared. Please refresh the booking before trying again.",
    BOOKING_CONTACT_PHONE_INVALID: "Enter the mobile number in international format, including the + country code.",
    BOOKING_CONTACT_EMAIL_INVALID: "Enter a valid contact email address."
  };

  if (messages[raw]) return messages[raw];

  if (/network request failed|could not be reached/i.test(raw)) {
    return "The live travel provider could not be reached. Please try again.";
  }
  if (/rate limit|rate limiting/i.test(raw)) {
    return "Live availability is temporarily busy. Please try again shortly.";
  }
  return raw.replace(
    /BOOKING_[A-Z0-9_]+/g,
    "The booking request could not be completed."
  );
}

function changeStatebox(step) {
  const box = getElement(STATEBOX_ID);
  const stateId = STEPS[step]?.state || STEPS.offer.state;
  if (!box || !box.changeState) return Promise.resolve();
  try {
    const result = box.changeState(stateId);
    return result && typeof result.then === "function" ? result : Promise.resolve();
  } catch (error) {
    console.warn("Could not change booking state", stateId, error);
    return Promise.resolve();
  }
}

function updateBookingUrl(step, extraQuery = {}) {
  const query = { step, ...extraQuery };
  if (cartId) query.cartId = cartId;
  if (cartToken) query.cartToken = cartToken;

  if (wixLocation.queryParams && wixLocation.queryParams.add) {
    try {
      wixLocation.queryParams.add(query);
      return;
    } catch (_) {}
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
  initializedSteps.delete(next);
  const stateChange = changeStatebox(next);

  if (!options.silentUrl) updateBookingUrl(next, options.query || {});

  Promise.resolve(stateChange).then(() => {
    if (!readyEmbeds.has(next)) return;
    initializeStep(next).catch((error) => {
      postError(next, publicBookingError(error));
    });
  });
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

async function handleBookingMessage(event, expectedStep) {
  const msg = event.data || {};
  const step = SOURCE_TO_STEP[msg.source];
  if (!step || step !== expectedStep) {
    console.warn(`Ignored booking message with unexpected source ${msg.source || "unknown"} from ${expectedStep}.`);
    return;
  }

  const actionKey = `${step}:${msg.type || ""}`;
  const isMutatingAction = MUTATING_MESSAGE_TYPES.has(msg.type);
  if (isMutatingAction && actionsInFlight.has(actionKey)) return;
  if (isMutatingAction) actionsInFlight.add(actionKey);

  try {
    if (msg.type === READY_TYPES[step]) {
      readyEmbeds.add(step);
      if (step === currentStep) await initializeStep(step);
      return;
    }

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
    console.error(`[Booking] ${step}:${msg.type || "unknown"} failed`, error);
    postError(step, publicBookingError(error));
  } finally {
    if (isMutatingAction) actionsInFlight.delete(actionKey);
  }
}

async function initializeStep(step) {
  if (initializedSteps.has(step)) return;
  if (initializationPromises.has(step)) return initializationPromises.get(step);

  const message = { source: STEPS[step].source, type: READY_TYPES[step] };
  const promise = (async () => {
    if (step === "offer") await handleOffer(message);
    else if (step === "extras") await handleExtras(message);
    else if (step === "transfer") await handleTransfer(message);
    else if (step === "apis") await handleApis(message);
    else if (step === "seats") await handleSeats(message);
    else if (step === "payment") await handlePayment(message);
    else if (step === "confirmation") await handleConfirmation(message);
    else if (step === "documents") await handleDocuments(message);
    initializedSteps.add(step);
  })();

  initializationPromises.set(step, promise);
  try { await promise; }
  finally { initializationPromises.delete(step); }
}

async function handleOffer(msg) {
  const access = bookingAccess(msg);

  if (msg.type === "BOOKING_OFFER_READY") {
    const cart = await getBookingCart(access);
    postToStep("offer", "BOOKING_CART_LOADED", { cart });
    return;
  }

  if (msg.type === "BOOKING_OFFER_ACCEPTED") {
    await saveOfferDecision({ ...access, termsAccepted: msg.termsAccepted === true });
    if (embeds.extras) {
      goStep("extras", { reason: "offer-accepted" });
      return;
    }
    await saveBookingExtras({ ...access, selectedExtras: [] });
    goStep("transfer", { reason: "extras-not-configured" });
  }
}

async function handleExtras(msg) {
  const access = bookingAccess(msg);

  if (msg.type === "BOOKING_EXTRAS_READY") {
    const payload = await getBookingExtras(access);
    postToStep("extras", "BOOKING_EXTRAS_LOADED", payload);
    return;
  }

  if (msg.type === "BOOKING_EXTRAS_SAVE") {
    const result = await saveBookingExtras({
      ...access,
      selectedExtras: msg.selectedExtras || []
    });
    goStep(result.requiresSignatureTransfer ? "transfer" : "apis", {
      reason: "extras-saved"
    });
  }
}

async function handleTransfer(msg) {
  const access = bookingAccess(msg);

  if (msg.type === "SIGNATURE_TRANSFER_READY") {
    const payload = await getSignatureTransferOptions(access);
    postToStep("transfer", "SIGNATURE_TRANSFER_OPTIONS", payload);
    return;
  }

  if (msg.type === "SIGNATURE_TRANSFER_SELECT") {
    await saveSignatureTransfer({ ...access, transfer: msg.transfer || null });
    goStep("apis", { reason: "transfer-selected" });
    return;
  }

  if (msg.type === "SIGNATURE_TRANSFER_SKIP") {
    await saveSignatureTransfer({ ...access, transfer: null });
    goStep("apis", { reason: "transfer-skipped" });
  }
}

async function handleApis(msg) {
  const access = bookingAccess(msg);

  if (msg.type === "APIS_HTML_READY") {
    const [cart, rules] = await Promise.all([
      getBookingCart({ ...access, view: "apis" }),
      getApisRulesForCart(access)
    ]);
    postToStep("apis", "APIS_CART_RULES_LOADED", { cart, rules });
    return;
  }

  if (msg.type === "APIS_RULES_REFRESH") {
    const rules = await refreshTravelRequirements({
      ...access,
      travelers: msg.travelers || []
    });
    postToStep("apis", "APIS_REQUIREMENTS_RESULT", { rules });
    return;
  }

  if (msg.type === "APIS_SAVE_AND_CONTINUE") {
    await savePassengerApisAndReprice({
      ...access,
      travelers: msg.travelers || [],
      contact: msg.contact || {}
    });
    const hasFlight = await bookingHasFlight(access);
    goStep(hasFlight ? "seats" : "payment", { reason: "apis-saved" });
  }
}

async function handleSeats(msg) {
  const access = bookingAccess(msg);

  if (msg.type === "SEATMAP_READY") {
    const payload = await getSeatmapForCart(access);
    postToStep("seats", "SEATMAP_LOADED", payload);
    return;
  }

  if (msg.type === "SEATMAP_SAVE") {
    await saveSeatSelections({
      ...access,
      selections: msg.selections || {}
    });
    goStep("payment", { reason: "seats-saved" });
    return;
  }

  if (msg.type === "SEATMAP_SKIP") {
    await saveSeatSelections({
      ...access,
      selections: {},
      skipped: true
    });
    goStep("payment", { reason: "seats-skipped" });
  }
}

async function handlePayment(msg) {
  const access = bookingAccess(msg);

  if (msg.type === "PAYMENT_READY") {
    const result = await prepareBookingPayment(access);
    postToStep("payment", "PAYMENT_SESSION_LOADED", result);
    return;
  }

  if (msg.type === "PAYMENT_COMMIT") {
    if (paymentCommitInFlight) return;
    paymentCommitInFlight = true;
    postToStep("payment", "PAYMENT_PROGRESS", {}, {
      message: "Verifying payment and creating your reservation..."
    });

    try {
      const result = await authorizePaymentAndCommitBooking({
        ...access,
        termsAccepted: msg.termsAccepted === true,
        paymentIntentId: String(
          msg.paymentIntentId || msg.payload?.paymentIntentId || ""
        )
      });
      goStep("confirmation", {
        reason: "payment-committed",
        query: { ref: result.bookingReference || "" }
      });
    } finally {
      paymentCommitInFlight = false;
    }
  }
}

async function handleConfirmation(msg) {
  const access = bookingAccess(msg);

  if (msg.type === "CONFIRMATION_READY") {
    const confirmation = await getSourceAwareBookingConfirmation(access);
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
    navigateInternal(msg.path);
  }
}

async function handleDocuments(msg) {
  const access = bookingAccess(msg);
  if (msg.type === "BOOKING_DOCUMENTS_READY") {
    const payload = await getTravelDocumentsForCart(access);
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
  navigateInternal(msg.path);
}

function navigateInternal(rawPath) {
  const path = String(rawPath || "").trim();
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("Invalid booking navigation destination.");
  }

  const allowedPrefixes = [
    "/home",
    "/booking",
    "/my-profile",
    "/travel-info",
    "/help",
    "/contact"
  ];
  const allowed = allowedPrefixes.some(
    (prefix) =>
      path === prefix ||
      path.startsWith(`${prefix}?`) ||
      path.startsWith(`${prefix}/`)
  );
  if (!allowed) throw new Error("Invalid booking navigation destination.");
  wixLocation.to(path);
}
