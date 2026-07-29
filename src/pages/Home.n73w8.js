import wixLocation from "wix-location-frontend";
import { currentMember, authentication } from "wix-members-frontend";

import {
  getHomeBootstrap,
  searchUnifiedOffers,
  createBookingCartFromOffer
} from "backend/bookingOrchestrator.web";

import {
  getOldStyleHomeContent
} from "backend/homeContent.web";

import {
  getCustomerHeaderSession,
  subscribeCustomerNewsletter
} from "backend/customerHeader.web";

/*
 * IMPORTANT:
 * This must be the ID of the actual Wix HTML Component,
 * not the page, section, strip, box or container.
 */
const EMBED_ID = "#htmlHome";

const HOME_SOURCE = "SKANDI_HOME_OLD_STYLE";
const HEADER_SOURCE = "SKANDI_CUSTOMER_HEADER_EXPANDBAR";
const FOOTER_SOURCE = "SKANDI_CUSTOMER_FOOTER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function getHtmlComponent(selector) {
  let element = null;

  try {
    element = $w(selector);
  } catch (error) {
    console.error(`[Home] Missing element ${selector}.`, error);
    return null;
  }

  if (
    !element ||
    typeof element.onMessage !== "function" ||
    typeof element.postMessage !== "function"
  ) {
    console.error(
      `[Home] ${selector} is not an HTML Component. ` +
      "Select the HTML embed in Wix and confirm its element ID."
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
  postToHtml(html, "CLOSE_CUSTOMER_HEADER_PANELS", {});
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
        menu: []
      });

      return;
    }

    const session = await getCustomerHeaderSession();

    postToHtml(html, "CUSTOMER_HEADER_STATE", session || {
      loggedIn: true,
      menu: []
    });
  } catch (error) {
    console.error("[Home] Could not load customer header state.", error);

    postToHtml(html, "CUSTOMER_HEADER_STATE", {
      loggedIn: false,
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
      return;

    case "HEADER_NAVIGATE":
      closeHeaderPanels(html);

      if (path) {
        wixLocation.to(path);
      }

      return;

    case "HEADER_SEARCH":
      closeHeaderPanels(html);

      /*
       * The header and Home search now live inside the same HTML Component.
       * Tell the Home HTML to scroll to the search instead of reloading /home.
       */
      postToHtml(html, "HOME_FOCUS_SEARCH", {});
      return;

    case "HEADER_LOGIN":
      closeHeaderPanels(html);

      await authentication.promptLogin();
      await sendHeaderState(html);
      return;

    case "HEADER_LOGOUT":
      closeHeaderPanels(html);

      await authentication.logout();
      wixLocation.to("/home");
      return;

    default:
      return;
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
      return;

    case "FOOTER_NAVIGATE":
      closeHeaderPanels(html);

      if (path) {
        wixLocation.to(path);
      }

      return;

    case "FOOTER_STAFF_LOGIN":
      closeHeaderPanels(html);
      wixLocation.to("/riaintra");
      return;

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

        return;
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

      return;
    }

    default:
      return;
  }
}

/* -------------------------------------------------------------------------- */
/* Home booking and content                                                    */
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

      return;
    }

    case "HOME_SEARCH": {
      const search = message.search || payload.search || {};

      const result = await searchUnifiedOffers({
        search
      });

      postToHtml(
        html,
        "HOME_SEARCH_RESULT",
        result || {
          items: []
        }
      );

      return;
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

      wixLocation.to(
        `/booking?step=offer&cartId=${encodeURIComponent(result.cartId)}`
      );

      return;
    }

    case "HOME_NAVIGATE": {
      const path = message.path || payload.path || "";

      if (path) {
        wixLocation.to(path);
      }

      return;
    }

    default:
      return;
  }
}

/* -------------------------------------------------------------------------- */
/* Initialize the single combined HTML Component                              */
/* -------------------------------------------------------------------------- */

$w.onReady(function () {
  const html = getHtmlComponent(EMBED_ID);

  if (!html) {
    return;
  }

  html.onMessage(async (event) => {
    const message = event.data || {};

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
      }
    } catch (error) {
      console.error(
        `[Home] ${message.source || "Unknown source"} / ` +
        `${message.type || "Unknown message"} failed.`,
        error
      );

      if (message.source === HOME_SOURCE) {
        postHomeError(html, error);
        return;
      }

      if (message.source === FOOTER_SOURCE) {
        postToHtml(html, "FOOTER_NEWSLETTER_RESULT", {
          ok: false,
          message: error?.message || "Newsletter signup failed."
        });

        return;
      }

      if (message.source === HEADER_SOURCE) {
        postToHtml(html, "CUSTOMER_HEADER_STATE", {
          loggedIn: false,
          menu: []
        });
      }
    }
  });
});
