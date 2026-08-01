import wixLocationFrontend from "wix-location-frontend";
import {
  currentMember,
  authentication
} from "wix-members-frontend";

import {
  getAboutPagePayload
} from "backend/skandiAboutSignature.web";

import {
  getCustomerHeaderSession,
  subscribeCustomerNewsletter
} from "backend/customerHeader.web";

const EMBED_ID = "#aboutSkandiEmbed";

const ABOUT_SOURCE = "SKANDI_ABOUT_PAGE";
const FOOTER_SOURCE = "SKANDI_CUSTOMER_FOOTER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

let aboutLoadPromise = null;
let headerLoadPromise = null;

/* ==========================================================================
   HTML COMPONENT
   ========================================================================== */

function getHtmlComponent() {
  try {
    const html = $w(EMBED_ID);

    if (
      !html ||
      typeof html.onMessage !== "function" ||
      typeof html.postMessage !== "function"
    ) {
      console.error(
        `[About] ${EMBED_ID} is not configured as a Wix HTML component.`
      );

      return null;
    }

    return html;
  } catch (error) {
    console.error(
      `[About] HTML component ${EMBED_ID} was not found.`,
      error
    );

    return null;
  }
}

function parseMessage(data) {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.warn(
        "[About] Ignored invalid JSON message.",
        error
      );

      return null;
    }
  }

  if (!data || typeof data !== "object") {
    return null;
  }

  return data;
}

function send(html, type, payload = {}) {
  if (!html) {
    return;
  }

  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function closeHeaderPanels(html) {
  send(
    html,
    "CLOSE_CUSTOMER_HEADER_PANELS",
    {}
  );
}

/* ==========================================================================
   NAVIGATION
   ========================================================================== */

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
    console.warn(
      `[About] Blocked invalid navigation target: ${path}`
    );

    return;
  }

  closeHeaderPanels(html);

  try {
    wixLocationFrontend.to(path);
  } catch (error) {
    console.error(
      `[About] Navigation failed for ${path}.`,
      error
    );
  }
}

/* ==========================================================================
   ABOUT PAGE DATA
   ========================================================================== */

async function sendAboutPageData(
  html,
  forceRefresh = false
) {
  if (aboutLoadPromise && !forceRefresh) {
    return aboutLoadPromise;
  }

  aboutLoadPromise = (async () => {
    try {
      const result = await getAboutPagePayload();

      const payload = {
        settings:
          result?.settings &&
          typeof result.settings === "object"
            ? result.settings
            : {},

        facts: Array.isArray(result?.facts)
          ? result.facts
          : [],

        timeline: Array.isArray(result?.timeline)
          ? result.timeline
          : [],

        partners: Array.isArray(result?.partners)
          ? result.partners
          : []
      };

      send(
        html,
        "ABOUT_PAGE_DATA",
        payload
      );
    } catch (error) {
      console.error(
        "[About] Could not load page payload.",
        error
      );

      send(
        html,
        "ABOUT_PAGE_ERROR",
        {
          message:
            "About page content is temporarily unavailable."
        }
      );
    } finally {
      aboutLoadPromise = null;
    }
  })();

  return aboutLoadPromise;
}

/* ==========================================================================
   CUSTOMER HEADER SESSION
   ========================================================================== */

function createGuestHeaderState() {
  return {
    loggedIn: false,
    displayName: "",
    points: 0,
    tierName: "",
    menu: []
  };
}

async function sendCustomerHeaderState(
  html,
  forceRefresh = false
) {
  if (headerLoadPromise && !forceRefresh) {
    return headerLoadPromise;
  }

  headerLoadPromise = (async () => {
    try {
      const member = await currentMember.getMember();

      if (!member) {
        send(
          html,
          "CUSTOMER_HEADER_STATE",
          createGuestHeaderState()
        );

        return;
      }

      const session =
        await getCustomerHeaderSession();

      send(
        html,
        "CUSTOMER_HEADER_STATE",
        {
          loggedIn: true,

          displayName:
            session?.displayName ||
            session?.name ||
            session?.member?.displayName ||
            member?.profile?.nickname ||
            member?.profile?.title ||
            member?.loginEmail ||
            "",

          points: Number(
            session?.points ||
            session?.clubPoints ||
            session?.rewards?.points ||
            0
          ),

          tierName:
            session?.tierName ||
            session?.tier ||
            session?.clubTier ||
            "",

          menu: Array.isArray(session?.menu)
            ? session.menu
            : []
        }
      );
    } catch (error) {
      console.error(
        "[About] Could not load customer header state.",
        error
      );

      send(
        html,
        "CUSTOMER_HEADER_STATE",
        createGuestHeaderState()
      );
    } finally {
      headerLoadPromise = null;
    }
  })();

  return headerLoadPromise;
}

/* ==========================================================================
   ABOUT AND HEADER MESSAGE HANDLERS
   ========================================================================== */

async function handleAboutMessage(
  html,
  message
) {
  const payload = message.payload || {};

  const path = String(
    message.path ||
    payload.path ||
    ""
  ).trim();

  switch (message.type) {
    case "ABOUT_PAGE_READY":
      await Promise.all([
        sendAboutPageData(html),
        sendCustomerHeaderState(html)
      ]);

      return true;

    case "ABOUT_PAGE_REFRESH":
      await sendAboutPageData(
        html,
        true
      );

      return true;

    case "HEADER_READY":
      await sendCustomerHeaderState(html);

      return true;

    case "HOME_NAVIGATE":
    case "HEADER_NAVIGATE":
      navigateTo(
        html,
        path
      );

      return true;

    case "HEADER_SEARCH":
      navigateTo(
        html,
        "/search"
      );

      return true;

    case "HEADER_LOGIN":
      closeHeaderPanels(html);

      try {
        await authentication.promptLogin();
      } catch (error) {
        /*
         * promptLogin() can reject when the visitor
         * closes the login dialog without signing in.
         */
        console.info(
          "[About] Login was cancelled or did not complete.",
          error
        );
      }

      await sendCustomerHeaderState(
        html,
        true
      );

      return true;

    case "HEADER_LOGOUT":
      closeHeaderPanels(html);

      try {
        await Promise.resolve(
          authentication.logout()
        );
      } catch (error) {
        console.warn(
          "[About] Logout returned an error.",
          error
        );
      }

      send(
        html,
        "CUSTOMER_HEADER_STATE",
        createGuestHeaderState()
      );

      wixLocationFrontend.to("/home");

      return true;

    case "UPDATE_SETTINGS":
      /*
       * Language and currency are stored in the
       * HTML component's localStorage.
       *
       * This event is intentionally accepted without
       * changing member, booking, or API data.
       */
      return true;

    default:
      return false;
  }
}

/* ==========================================================================
   FOOTER MESSAGE HANDLERS
   ========================================================================== */

async function handleFooterMessage(
  html,
  message
) {
  const payload = message.payload || {};

  const path = String(
    message.path ||
    payload.path ||
    ""
  ).trim();

  switch (message.type) {
    case "FOOTER_READY":
      send(
        html,
        "CUSTOMER_FOOTER_STATE",
        {
          ready: true
        }
      );

      return true;

    case "FOOTER_NAVIGATE":
      navigateTo(
        html,
        path
      );

      return true;

    case "FOOTER_STAFF_LOGIN":
      navigateTo(
        html,
        "/riaintra"
      );

      return true;

    case "FOOTER_NEWSLETTER_SIGNUP": {
      const email = String(
        message.email ||
        payload.email ||
        ""
      ).trim();

      if (!email) {
        send(
          html,
          "FOOTER_NEWSLETTER_RESULT",
          {
            ok: false,
            message:
              "Please enter your email address."
          }
        );

        return true;
      }

      try {
        const result =
          await subscribeCustomerNewsletter({
            email,
            source:
              payload.source ||
              "Footer"
          });

        send(
          html,
          "FOOTER_NEWSLETTER_RESULT",
          {
            ok: true,

            message:
              result?.status === "updated"
                ? "Your subscription is already active."
                : "Thank you for subscribing.",

            ...(result || {})
          }
        );
      } catch (error) {
        console.error(
          "[About] Newsletter signup failed.",
          error
        );

        send(
          html,
          "FOOTER_NEWSLETTER_RESULT",
          {
            ok: false,
            message:
              error?.message ||
              "Newsletter signup failed."
          }
        );
      }

      return true;
    }

    default:
      return false;
  }
}

/* ==========================================================================
   PAGE INITIALIZATION
   ========================================================================== */

$w.onReady(function () {
  const html = getHtmlComponent();

  if (!html) {
    return;
  }

  html.onMessage(async (event) => {
    const message =
      parseMessage(event.data);

    if (
      !message ||
      !message.type
    ) {
      return;
    }

    try {
      if (
        message.source === ABOUT_SOURCE
      ) {
        await handleAboutMessage(
          html,
          message
        );

        return;
      }

      if (
        message.source === FOOTER_SOURCE
      ) {
        await handleFooterMessage(
          html,
          message
        );

        return;
      }

      console.warn(
        `[About] Ignored message from unknown source: ${
          message.source || "none"
        }`
      );
    } catch (error) {
      console.error(
        `[About] ${
          message.source || "unknown"
        } / ${
          message.type || "unknown"
        } failed.`,
        error
      );

      if (
        message.source === FOOTER_SOURCE
      ) {
        send(
          html,
          "FOOTER_NEWSLETTER_RESULT",
          {
            ok: false,
            message:
              error?.message ||
              "Footer action failed."
          }
        );

        return;
      }

      send(
        html,
        "ABOUT_PAGE_ERROR",
        {
          message:
            error?.message ||
            "About page action failed."
        }
      );
    }
  });

  /*
   * Load immediately.
   *
   * The HTML also sends ABOUT_PAGE_READY and HEADER_READY.
   * The promise guards prevent duplicate backend calls.
   */
  Promise.all([
    sendAboutPageData(html),
    sendCustomerHeaderState(html)
  ]).catch((error) => {
    console.error(
      "[About] Initial page bootstrap failed.",
      error
    );
  });
});
