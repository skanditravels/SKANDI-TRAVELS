import wixLocationFrontend from "wix-location-frontend";
import {
  currentMember,
  authentication
} from "wix-members-frontend";

import {
  getHomeBootstrap,
  searchUnifiedOffers,
  createBookingCartFromOffer
} from "src/backend/bookingOrchestrator.web";

import {
  getOldStyleHomeContent
} from "src/backend/homeContent.web";

import {
  getCustomerHeaderSession,
  subscribeCustomerNewsletter
} from "src/backend/customerHeader.web";

/*
 * This must be the ID of the HTML Component containing the complete
 * Home page, header, mobile drawer and footer.
 */
const EMBED_ID = "#htmlHome";

const HOME_SOURCE = "SKANDI_HOME_OLD_STYLE";
const HEADER_SOURCE = "SKANDI_CUSTOMER_HEADER_EXPANDBAR";
const FOOTER_SOURCE = "SKANDI_CUSTOMER_FOOTER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                             */
/* -------------------------------------------------------------------------- */

function getHtmlComponent(selector) {
  let element;

  try {
    element = $w(selector);
  } catch (error) {
    console.error(`[Home] Element ${selector} was not found.`, error);
    return null;
  }

  if (
    !element ||
    typeof element.onMessage !== "function" ||
    typeof element.postMessage !== "function"
  ) {
    console.error(
      `[Home] ${selector} is not a Wix HTML Component. ` +
      "Select the HTML embed and verify its element ID."
    );

    return null;
  }

  return element;
}

function postToHtml(html, type, payload = {}) {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function postHomeError(html, error) {
  html.postMessage({
    source: PARENT_SOURCE,
    type: "HOME_ERROR",
    message: error?.message || "The request failed.",
    timestamp: new Date().toISOString()
  });
}

function closeHeaderPanels(html) {
  postToHtml(html, "CLOSE_CUSTOMER_HEADER_PANELS");
}

function navigateTo(html, rawPath) {
  const path = String(rawPath || "").trim();

  if (!path) {
    return;
  }

  const isInternalPath = path.startsWith("/");
  const isExternalUrl = /^https?:\/\//i.test(path);
  const isEmailLink = /^mailto:/i.test(path);
  const isPhoneLink = /^tel:/i.test(path);

  if (
    !isInternalPath &&
    !isExternalUrl &&
    !isEmailLink &&
    !isPhoneLink
  ) {
    console.warn(`[Home] Blocked invalid navigation target: ${path}`);
    return;
  }

  closeHeaderPanels(html);
  wixLocationFrontend.to(path);
}

/* -------------------------------------------------------------------------- */
/* Customer header                                                            */
/* -------------------------------------------------------------------------- */

async function sendHeaderState(html) {
  try {
    const member = await currentMember.getMember();

    if (!member) {
      postToHtml(html, "CUSTOMER_HEADER_STATE", {
        loggedIn: false,
        displayName: "",
        points: 0,
        tierName: "",
        menu: []
      });

      return;
    }

    const session = await getCustomerHeaderSession();

    postToHtml(html, "CUSTOMER_HEADER_STATE", {
      loggedIn: true,
      displayName: session?.displayName || "",
      points: Number(session?.points || 0),
      tierName: session?.tierName || "",
      menu: Array.isArray(session?.menu) ? session.menu : []
    });
  } catch (error) {
    console.error("[Home] Could not load customer header state.", error);

    postToHtml(html, "CUSTOMER_HEADER_STATE", {
      loggedIn: false,
      displayName: "",
      points: 0,
      tierName: "",
      menu: []
    });
  }
}

async function handleHeaderMessage(html, message) {
  const payload = message.payload || {};
  const path = message.path || payload.path || "";

  switch (message.type) {
    case "HEADER_READY":
      await sendHeaderState(html);
      return true;

    /*
     * Compatibility handler. The current combined HTML normally sends
     * HOME_NAVIGATE for menu links, but older header versions may still
     * send HEADER_NAVIGATE.
     */
    case "HEADER_NAVIGATE":
      navigateTo(html, path);
      return true;

    case "HEADER_SEARCH":
      closeHeaderPanels(html);

      /*
       * Header and Home search are inside the same HTML Component.
       * Ask the HTML to reveal and focus its existing search form.
       */
      postToHtml(html, "HOME_FOCUS_SEARCH");
      return true;

    case "HEADER_LOGIN":
      closeHeaderPanels(html);

      try {
        await authentication.promptLogin();
      } catch (error) {
        /*
         * promptLogin() rejects when the visitor closes the login dialog.
         * Treat that as a cancelled action instead of a page-level failure.
         */
        console.info("[Home] Login was cancelled or did not complete.", error);
      }

      await sendHeaderState(html);
      return true;

    case "HEADER_LOGOUT":
      closeHeaderPanels(html);

      authentication.logout();

      postToHtml(html, "CUSTOMER_HEADER_STATE", {
        loggedIn: false,
        displayName: "",
        points: 0,
        tierName: "",
        menu: []
      });

      wixLocationFrontend.to("/home");
      return true;

    default:
      return false;
  }
}

/* -------------------------------------------------------------------------- */
/* Customer footer                                                            */
/* -------------------------------------------------------------------------- */

async function handleFooterMessage(html, message) {
  const payload = message.payload || {};
  const path = message.path || payload.path || "";

  switch (message.type) {
    case "FOOTER_READY":
      postToHtml(html, "CUSTOMER_FOOTER_STATE", {
        ready: true
      });

      return true;

    /*
     * Compatibility handler. The current combined HTML normally sends
     * HOME_NAVIGATE for footer links.
     */
    case "FOOTER_NAVIGATE":
      navigateTo(html, path);
      return true;

    case "FOOTER_STAFF_LOGIN":
      navigateTo(html, "/riaintra");
      return true;

    case "FOOTER_NEWSLETTER_SIGNUP": {
      const email = String(
        message.email ||
        payload.email ||
        ""
      ).trim();

      if (!email) {
        postToHtml(html, "FOOTER_NEWSLETTER_RESULT", {
          ok: false,
          message: "Please enter your email address."
        });

        return true;
      }

      const result = await subscribeCustomerNewsletter({
        email,
        source: payload.source || "Footer"
      });

      postToHtml(
        html,
        "FOOTER_NEWSLETTER_RESULT",
        result || {
          ok: true,
          message: "Thank you for subscribing."
        }
      );

      return true;
    }

    default:
      return false;
  }
}

/* -------------------------------------------------------------------------- */
/* Home booking, content and navigation                                       */
/* -------------------------------------------------------------------------- */

async function handleHomeMessage(html, message) {
  const payload = message.payload || {};

  switch (message.type) {
    case "HOME_READY": {
      const [booking, content] = await Promise.all([
        getHomeBootstrap({}),
        getOldStyleHomeContent({})
      ]);

      postToHtml(html, "HOME_BOOTSTRAP_RESULT", {
        booking: booking || {},
        content: content || {}
      });

      return true;
    }

    case "HOME_SEARCH": {
      const search = message.search || payload.search || {};

      const result = await searchUnifiedOffers({
        search
      });

      postToHtml(html, "HOME_SEARCH_RESULT", {
        ...(result || {}),
        items: Array.isArray(result?.items) ? result.items : []
      });

      return true;
    }

    case "HOME_SELECT_OFFER": {
      const offer = message.offer || payload.offer || {};
      const search =
        message.search ||
        payload.search ||
        offer.searchContext ||
        {};

      const result = await createBookingCartFromOffer({
        offer,
        search
      });

      if (!result?.cartId) {
        throw new Error(
          "The booking cart was not created because no cart ID was returned."
        );
      }

      postToHtml(html, "HOME_NAVIGATE_TO_OFFER", result);

      navigateTo(
        html,
        `/booking?step=offer&cartId=${encodeURIComponent(result.cartId)}`
      );

      return true;
    }

    /*
     * All current header, mobile drawer, Home and footer links use this
     * one message type through navigateParent() in the HTML.
     */
    case "HOME_NAVIGATE": {
      const path = message.path || payload.path || "";

      navigateTo(html, path);
      return true;
    }

    default:
      return false;
  }
}

/* -------------------------------------------------------------------------- */
/* Error routing                                                              */
/* -------------------------------------------------------------------------- */

function handleMessageError(html, message, error) {
  console.error(
    `[Home] ${message.source || "Unknown source"} / ` +
    `${message.type || "Unknown message"} failed.`,
    error
  );

  if (message.source === HOME_SOURCE) {
    postHomeError(html, error);
    return;
  }

  if (
    message.source === FOOTER_SOURCE &&
    message.type === "FOOTER_NEWSLETTER_SIGNUP"
  ) {
    postToHtml(html, "FOOTER_NEWSLETTER_RESULT", {
      ok: false,
      message: error?.message || "Newsletter signup failed."
    });

    return;
  }

  if (message.source === HEADER_SOURCE) {
    postToHtml(html, "CUSTOMER_HEADER_STATE", {
      loggedIn: false,
      displayName: "",
      points: 0,
      tierName: "",
      menu: []
    });
  }
}

/* -------------------------------------------------------------------------- */
/* Initialize the combined Home HTML Component                                */
/* -------------------------------------------------------------------------- */

$w.onReady(function () {
  const html = getHtmlComponent(EMBED_ID);

  if (!html) {
    return;
  }

  html.onMessage(async (event) => {
    const message = event.data || {};

    if (!message.source || !message.type) {
      return;
    }

    try {
      if (message.source === HOME_SOURCE) {
        await handleHomeMessage(html, message);
        return;
      }

      if (message.source === HEADER_SOURCE) {
        await handleHeaderMessage(html, message);
        return;
      }

      if (message.source === FOOTER_SOURCE) {
        await handleFooterMessage(html, message);
        return;
      }

      console.warn(
        `[Home] Ignored message from unknown source: ${message.source}`
      );
    } catch (error) {
      handleMessageError(html, message, error);
    }
  });
});
