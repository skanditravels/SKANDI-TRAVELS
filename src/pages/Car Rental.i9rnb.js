import wixLocationFrontend from "wix-location-frontend";
import { currentMember, authentication } from "wix-members-frontend";

import {
  getCarRentalBootstrap,
  searchCarRentalOffers,
  getCarRentalOfferDetails,
  repriceCarRentalQuote,
  createCarRentalBooking,
  getCarRentalBooking,
  cancelCarRentalBooking,
  emailCarRentalConfirmation
} from "backend/carRentalService.web";

import {
  getCustomerHeaderSession,
  subscribeCustomerNewsletter
} from "backend/customerHeader.web";

const EMBED_ID = "#carRentalHtml";
const APP_SOURCE = "SKANDI_CAR_RENTAL";
const HEADER_SOURCE = "SKANDI_CUSTOMER_HEADER_EXPANDBAR";
const FOOTER_SOURCE = "SKANDI_CUSTOMER_FOOTER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

let bootstrapPromise = null;
let headerPromise = null;

function getHtml() {
  try {
    const html = $w(EMBED_ID);
    if (!html || typeof html.onMessage !== "function" || typeof html.postMessage !== "function") {
      console.error(`[Car Rental] ${EMBED_ID} is not a Wix HTML Component.`);
      return null;
    }
    return html;
  } catch (error) {
    console.error(`[Car Rental] ${EMBED_ID} was not found.`, error);
    return null;
  }
}

function parseMessage(data) {
  if (typeof data === "string") {
    try { return JSON.parse(data); } catch (_) { return null; }
  }
  return data && typeof data === "object" ? data : null;
}

function post(html, type, payload = {}) {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function postError(html, error, fallback = "The car rental request failed.") {
  post(html, "CAR_RENTAL_ERROR", {
    message: error?.message || fallback,
    code: error?.code || "CAR_RENTAL_ERROR"
  });
}

function closePanels(html) {
  post(html, "CLOSE_CUSTOMER_HEADER_PANELS", {});
}

function navigateTo(html, rawPath) {
  const path = String(rawPath || "").trim();
  if (!path) return;

  const valid =
    path.startsWith("/") ||
    /^https?:\/\//i.test(path) ||
    /^mailto:/i.test(path) ||
    /^tel:/i.test(path);

  if (!valid) {
    console.warn(`[Car Rental] Blocked invalid navigation target: ${path}`);
    return;
  }

  closePanels(html);
  wixLocationFrontend.to(path);
}

function guestHeaderState() {
  return {
    loggedIn: false,
    displayName: "",
    points: 0,
    tierName: "",
    menu: []
  };
}

async function sendHeaderState(html, force = false) {
  if (headerPromise && !force) return headerPromise;

  headerPromise = (async () => {
    try {
      const member = await currentMember.getMember();
      if (!member) {
        post(html, "CUSTOMER_HEADER_STATE", guestHeaderState());
        return;
      }

      const session = await getCustomerHeaderSession();
      post(html, "CUSTOMER_HEADER_STATE", {
        loggedIn: true,
        displayName:
          session?.displayName ||
          session?.name ||
          member?.profile?.nickname ||
          member?.profile?.title ||
          member?.loginEmail ||
          "",
        points: Number(session?.points || session?.clubPoints || 0),
        tierName: session?.tierName || session?.tier || "",
        menu: Array.isArray(session?.menu) ? session.menu : []
      });
    } catch (error) {
      console.error("[Car Rental] Could not load header state.", error);
      post(html, "CUSTOMER_HEADER_STATE", guestHeaderState());
    } finally {
      headerPromise = null;
    }
  })();

  return headerPromise;
}

async function sendBootstrap(html, force = false) {
  if (bootstrapPromise && !force) return bootstrapPromise;

  bootstrapPromise = (async () => {
    try {
      const payload = await getCarRentalBootstrap({});
      post(html, "CAR_RENTAL_BOOTSTRAP_RESULT", payload || {});
    } catch (error) {
      console.error("[Car Rental] Bootstrap failed.", error);
      postError(html, error, "Car rental setup is temporarily unavailable.");
    } finally {
      bootstrapPromise = null;
    }
  })();

  return bootstrapPromise;
}

async function handleHeader(html, message) {
  const payload = message.payload || {};
  const path = message.path || payload.path || "";

  switch (message.type) {
    case "HEADER_READY":
      await sendHeaderState(html);
      return true;

    case "HEADER_NAVIGATE":
      navigateTo(html, path);
      return true;

    case "HEADER_SEARCH":
      navigateTo(html, "/search");
      return true;

    case "HEADER_LOGIN":
      closePanels(html);
      try {
        await authentication.promptLogin();
      } catch (error) {
        console.info("[Car Rental] Login was cancelled or incomplete.", error);
      }
      await sendHeaderState(html, true);
      return true;

    case "HEADER_LOGOUT":
      closePanels(html);
      try {
        await Promise.resolve(authentication.logout());
      } catch (error) {
        console.warn("[Car Rental] Logout returned an error.", error);
      }
      post(html, "CUSTOMER_HEADER_STATE", guestHeaderState());
      wixLocationFrontend.to("/home");
      return true;

    case "UPDATE_SETTINGS":
      return true;

    default:
      return false;
  }
}

async function handleFooter(html, message) {
  const payload = message.payload || {};
  const path = message.path || payload.path || "";

  switch (message.type) {
    case "FOOTER_READY":
      post(html, "CUSTOMER_FOOTER_STATE", { ready: true });
      return true;

    case "FOOTER_NAVIGATE":
      navigateTo(html, path);
      return true;

    case "FOOTER_STAFF_LOGIN":
      navigateTo(html, "/riaintra");
      return true;

    case "FOOTER_NEWSLETTER_SIGNUP": {
      const email = String(message.email || payload.email || "").trim();
      if (!email) {
        post(html, "FOOTER_NEWSLETTER_RESULT", {
          ok: false,
          message: "Please enter your email address."
        });
        return true;
      }

      try {
        const result = await subscribeCustomerNewsletter({
          email,
          source: payload.source || "Footer"
        });
        post(html, "FOOTER_NEWSLETTER_RESULT", {
          ok: true,
          message:
            result?.status === "updated"
              ? "Your subscription is already active."
              : "Thank you for subscribing.",
          ...(result || {})
        });
      } catch (error) {
        post(html, "FOOTER_NEWSLETTER_RESULT", {
          ok: false,
          message: error?.message || "Newsletter signup failed."
        });
      }
      return true;
    }

    default:
      return false;
  }
}

async function handleApp(html, message) {
  const payload = message.payload || {};

  switch (message.type) {
    case "CAR_RENTAL_READY":
      await Promise.all([
        sendBootstrap(html),
        sendHeaderState(html)
      ]);
      return true;

    case "CAR_RENTAL_REFRESH":
      await sendBootstrap(html, true);
      return true;

    case "CAR_RENTAL_NAVIGATE":
      navigateTo(html, payload.path || message.path);
      return true;

    case "CAR_RENTAL_SEARCH": {
      const result = await searchCarRentalOffers(payload.search || {});
      post(html, "CAR_RENTAL_SEARCH_RESULT", {
        ...(result || {}),
        items: Array.isArray(result?.items) ? result.items : []
      });
      return true;
    }

    case "CAR_RENTAL_GET_OFFER": {
      const result = await getCarRentalOfferDetails({
        offerId: payload.offerId,
        offer: payload.offer
      });
      post(html, "CAR_RENTAL_OFFER_RESULT", {
        offer: result?.offer || result || payload.offer || {}
      });
      return true;
    }

    case "CAR_RENTAL_REPRICE": {
      const result = await repriceCarRentalQuote({
        offerId: payload.offerId,
        offer: payload.offer,
        extras: payload.extras || {},
        search: payload.search || {}
      });
      post(html, "CAR_RENTAL_REPRICE_RESULT", {
        quote: result?.quote || result || {}
      });
      return true;
    }

    case "CAR_RENTAL_BOOK": {
      const result = await createCarRentalBooking(payload);
      if (result?.requiresLogin) {
        try {
          await authentication.promptLogin();
        } catch (error) {
          postError(html, {
            message: "Sign in was cancelled. The rental was not booked."
          });
          return true;
        }
        await sendHeaderState(html, true);
      }

      const bookingResult = result?.requiresLogin
        ? await createCarRentalBooking(payload)
        : result;

      if (bookingResult?.requiresLogin) {
        throw new Error(bookingResult.message || "Sign in to continue.");
      }

      post(html, "CAR_RENTAL_BOOKING_RESULT", {
        booking: bookingResult?.booking || bookingResult || {}
      });
      return true;
    }

    case "CAR_RENTAL_LOOKUP_BOOKING": {
      const result = await getCarRentalBooking({
        reference: payload.reference,
        email: payload.email
      });
      post(html, "CAR_RENTAL_LOOKUP_RESULT", {
        booking: result?.booking || result || {}
      });
      return true;
    }

    case "CAR_RENTAL_CANCEL_BOOKING": {
      const result = await cancelCarRentalBooking({
        reference: payload.reference,
        email: payload.email
      });
      post(html, "CAR_RENTAL_CANCEL_RESULT", result || {});
      return true;
    }

    case "CAR_RENTAL_EMAIL_CONFIRMATION": {
      const result = await emailCarRentalConfirmation({
        bookingReference: payload.bookingReference,
        email: payload.email
      });
      post(html, "CAR_RENTAL_EMAIL_RESULT", result || {
        ok: true,
        message: "Confirmation email requested."
      });
      return true;
    }

    default:
      return false;
  }
}

$w.onReady(function () {
  const html = getHtml();
  if (!html) return;

  html.onMessage(async (event) => {
    const message = parseMessage(event.data);
    if (!message?.source || !message?.type) return;

    try {
      if (message.source === APP_SOURCE) {
        await handleApp(html, message);
        return;
      }
      if (message.source === HEADER_SOURCE) {
        await handleHeader(html, message);
        return;
      }
      if (message.source === FOOTER_SOURCE) {
        await handleFooter(html, message);
        return;
      }
      console.warn(`[Car Rental] Ignored unknown source: ${message.source}`);
    } catch (error) {
      console.error(`[Car Rental] ${message.source} / ${message.type} failed.`, error);
      postError(html, error);
    }
  });

  Promise.all([
    sendBootstrap(html),
    sendHeaderState(html)
  ]).catch((error) => {
    console.error("[Car Rental] Initial bootstrap failed.", error);
  });
});
