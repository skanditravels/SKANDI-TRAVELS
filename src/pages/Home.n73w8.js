import wixLocationFrontend from "wix-location-frontend";

import {
  currentMember,
  authentication
} from "wix-members-frontend";

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
 * Wix page: /home
 * HTML Component ID: #htmlHome
 *
 * The HTML contains:
 * - Home booking search
 * - Locked SKANDI customer header
 * - Language and currency controls
 * - Mobile navigation
 * - SKANDI Club panel
 * - Locked SKANDI customer footer
 */
const EMBED_ID = "#htmlHome";

const HOME_SOURCE = "SKANDI_HOME_OLD_STYLE";
const HEADER_SOURCE = "SKANDI_CUSTOMER_HEADER_EXPANDBAR";
const FOOTER_SOURCE = "SKANDI_CUSTOMER_FOOTER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

let bootstrapPromise = null;
let headerPromise = null;

let currentSettings = {
  language: "EN",
  currency: "USD"
};

const SUPPORTED_LANGUAGES = [
  "EN",
  "SV",
  "NO",
  "DA",
  "ES",
  "FI",
  "FR-FR",
  "FR-CA",
  "DE",
  "TH"
];

const SUPPORTED_CURRENCIES = [
  "USD",
  "SEK",
  "NOK",
  "DKK",
  "EUR"
];

function normalizeSettings(value = {}) {
  const language =
    String(value?.language || "")
      .trim()
      .toUpperCase();

  const currency =
    String(value?.currency || "")
      .trim()
      .toUpperCase();

  return {
    language:
      SUPPORTED_LANGUAGES.includes(language)
        ? language
        : "EN",

    currency:
      SUPPORTED_CURRENCIES.includes(currency)
        ? currency
        : "USD"
  };
}

/* ==========================================================================
   HTML COMPONENT HELPERS
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
        `[Home] ${EMBED_ID} is not configured as a Wix HTML Component.`
      );

      return null;
    }

    return html;
  } catch (error) {
    console.error(
      `[Home] HTML Component ${EMBED_ID} was not found.`,
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
        "[Home] Ignored an invalid JSON message.",
        error
      );

      return null;
    }
  }

  return data && typeof data === "object"
    ? data
    : null;
}

function postToHtml(
  html,
  type,
  payload = {}
) {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function postHomeError(
  html,
  error
) {
  postToHtml(
    html,
    "HOME_ERROR",
    {
      message:
        error?.message ||
        "The request could not be completed."
    }
  );
}

function closeHeaderPanels(html) {
  postToHtml(
    html,
    "CLOSE_CUSTOMER_HEADER_PANELS",
    {}
  );
}

/* ==========================================================================
   NAVIGATION
   ========================================================================== */

function navigateTo(
  html,
  rawPath
) {
  const path =
    String(rawPath || "").trim();

  if (!path) {
    return;
  }

  const validTarget =
    path.startsWith("/") ||
    /^https?:\/\//i.test(path) ||
    /^mailto:/i.test(path) ||
    /^tel:/i.test(path);

  if (!validTarget) {
    console.warn(
      `[Home] Blocked invalid navigation target: ${path}`
    );

    return;
  }

  closeHeaderPanels(html);

  try {
    wixLocationFrontend.to(path);
  } catch (error) {
    console.error(
      `[Home] Navigation failed for ${path}.`,
      error
    );
  }
}

/* ==========================================================================
   CUSTOMER HEADER
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

async function sendHeaderState(
  html,
  forceRefresh = false
) {
  if (
    headerPromise &&
    !forceRefresh
  ) {
    return headerPromise;
  }

  headerPromise = (async () => {
    try {
      const member =
        await currentMember.getMember();

      if (!member) {
        postToHtml(
          html,
          "CUSTOMER_HEADER_STATE",
          createGuestHeaderState()
        );

        return;
      }

      const session =
        await getCustomerHeaderSession();

      const displayName =
        session?.displayName ||
        session?.name ||
        session?.member?.displayName ||
        member?.profile?.nickname ||
        member?.profile?.title ||
        member?.loginEmail ||
        "";

      const points = Number(
        session?.points ||
        session?.clubPoints ||
        session?.rewards?.points ||
        0
      );

      const tierName =
        session?.tierName ||
        session?.tier ||
        session?.clubTier ||
        "";

      postToHtml(
        html,
        "CUSTOMER_HEADER_STATE",
        {
          loggedIn: true,
          displayName,
          points,
          tierName,
          menu: Array.isArray(session?.menu)
            ? session.menu
            : []
        }
      );
    } catch (error) {
      console.error(
        "[Home] Could not load customer header state.",
        error
      );

      postToHtml(
        html,
        "CUSTOMER_HEADER_STATE",
        createGuestHeaderState()
      );
    } finally {
      headerPromise = null;
    }
  })();

  return headerPromise;
}

async function handleHeaderMessage(
  html,
  message
) {
  const payload =
    message.payload || {};

  const path = String(
    message.path ||
    payload.path ||
    ""
  ).trim();

  switch (message.type) {
    case "HEADER_READY":
      await sendHeaderState(html);
      return true;

    case "HEADER_NAVIGATE":
      navigateTo(
        html,
        path
      );

      return true;

    case "HEADER_SEARCH":
      closeHeaderPanels(html);

      /*
       * The search form is in the same HTML Component.
       * Ask the HTML to return to the Home search area.
       */
      postToHtml(
        html,
        "HOME_FOCUS_SEARCH",
        {}
      );

      return true;

    case "HEADER_LOGIN":
      closeHeaderPanels(html);

      try {
        await authentication.promptLogin();
      } catch (error) {
        /*
         * Wix rejects the promise when the visitor closes
         * the login dialog without completing sign-in.
         */
        console.info(
          "[Home] Login was cancelled or incomplete.",
          error
        );
      }

      await sendHeaderState(
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
          "[Home] Logout returned an error.",
          error
        );
      }

      postToHtml(
        html,
        "CUSTOMER_HEADER_STATE",
        createGuestHeaderState()
      );

      wixLocationFrontend.to("/home");

      return true;

    case "UPDATE_SETTINGS":
      currentSettings =
        normalizeSettings(payload);

      /*
       * Refresh public content using the selected locale and
       * currency. Backends may return localized content fields,
       * translated records and currency-specific card prices.
       */
      await sendHomeBootstrap(
        html,
        true,
        currentSettings
      );

      postToHtml(
        html,
        "HOME_SETTINGS_APPLIED",
        {
          settings:
            currentSettings
        }
      );

      return true;

    default:
      return false;
  }
}

/* ==========================================================================
   CUSTOMER FOOTER
   ========================================================================== */

async function handleFooterMessage(
  html,
  message
) {
  const payload =
    message.payload || {};

  const path = String(
    message.path ||
    payload.path ||
    ""
  ).trim();

  switch (message.type) {
    case "FOOTER_READY":
      postToHtml(
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
        postToHtml(
          html,
          "FOOTER_NEWSLETTER_RESULT",
          {
            ok: false,
            code:
              "EMAIL_REQUIRED",
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

        postToHtml(
          html,
          "FOOTER_NEWSLETTER_RESULT",
          {
            ok: true,

            code:
              result?.status === "updated"
                ? "ALREADY_ACTIVE"
                : "SUBSCRIBED",

            message:
              result?.status === "updated"
                ? "Your subscription is already active."
                : "Thank you for subscribing.",

            ...(result || {})
          }
        );
      } catch (error) {
        console.error(
          "[Home] Newsletter signup failed.",
          error
        );

        postToHtml(
          html,
          "FOOTER_NEWSLETTER_RESULT",
          {
            ok: false,
            code:
              "SIGNUP_FAILED",
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
   HOME BOOTSTRAP
   ========================================================================== */

async function sendHomeBootstrap(
  html,
  forceRefresh = false,
  settingsOverride = null
) {
  if (
    bootstrapPromise &&
    !forceRefresh
  ) {
    return bootstrapPromise;
  }

  if (settingsOverride) {
    currentSettings =
      normalizeSettings(
        settingsOverride
      );
  }

  bootstrapPromise = (async () => {
    try {
      const request = {
        locale:
          currentSettings.language,

        language:
          currentSettings.language,

        currency:
          currentSettings.currency
      };

      const [
        booking,
        content
      ] = await Promise.all([
        getHomeBootstrap(request),
        getOldStyleHomeContent(request)
      ]);

      postToHtml(
        html,
        "HOME_BOOTSTRAP_RESULT",
        {
          booking:
            booking || {},

          content:
            content || {},

          settings:
            currentSettings
        }
      );
    } catch (error) {
      console.error(
        "[Home] Bootstrap failed.",
        error
      );

      postHomeError(
        html,
        error
      );
    } finally {
      bootstrapPromise = null;
    }
  })();

  return bootstrapPromise;
}

/* ==========================================================================
   HOME SEARCH AND BOOKING
   ========================================================================== */

async function handleHomeMessage(
  html,
  message
) {
  const payload =
    message.payload || {};

  switch (message.type) {
    case "HOME_READY":
      currentSettings =
        normalizeSettings(
          message.settings ||
          payload.settings ||
          currentSettings
        );

      await sendHomeBootstrap(
        html,
        false,
        currentSettings
      );

      return true;

    case "HOME_REFRESH":
      await sendHomeBootstrap(
        html,
        true,
        currentSettings
      );

      return true;

    case "HOME_SEARCH": {
      const rawSearch =
        message.search ||
        payload.search ||
        {};

      const search = {
        ...rawSearch,

        locale:
          rawSearch.locale ||
          currentSettings.language,

        language:
          rawSearch.language ||
          currentSettings.language,

        currency:
          rawSearch.currency ||
          currentSettings.currency
      };

      const result =
        await searchUnifiedOffers({
          search
        });

      postToHtml(
        html,
        "HOME_SEARCH_RESULT",
        {
          ...(result || {}),

          items:
            Array.isArray(result?.items)
              ? result.items
              : []
        }
      );

      return true;
    }

    case "HOME_SELECT_OFFER": {
      const offer =
        message.offer ||
        payload.offer ||
        {};

      const search =
        message.search ||
        payload.search ||
        offer.searchContext ||
        {};

      let result =
        await createBookingCartFromOffer({
          offer,
          search
        });

      if (result?.requiresLogin) {
        try {
          await authentication.promptLogin();
        } catch (error) {
          postHomeError(
            html,
            {
              message:
                "Sign in was cancelled. The offer was not saved."
            }
          );

          return true;
        }

        await sendHeaderState(
          html,
          true
        );

        result =
          await createBookingCartFromOffer({
            offer,
            search
          });
      }

      if (result?.requiresLogin) {
        throw new Error(
          result?.message ||
          "Sign in to continue with this offer."
        );
      }

      if (!result?.cartId) {
        throw new Error(
          "The booking cart was not created because no cart ID was returned."
        );
      }

      postToHtml(
        html,
        "HOME_NAVIGATE_TO_OFFER",
        result
      );

      const allowedSteps = [
        "offer",
        "extras",
        "transfer",
        "apis",
        "seats",
        "payment",
        "confirmation"
      ];

      const step =
        allowedSteps.includes(result?.step)
          ? result.step
          : "offer";

      navigateTo(
        html,
        `/booking?step=${encodeURIComponent(step)}&cartId=${encodeURIComponent(result.cartId)}`
      );

      return true;
    }

    case "HOME_NAVIGATE": {
      const path = String(
        message.path ||
        payload.path ||
        ""
      ).trim();

      navigateTo(
        html,
        path
      );

      return true;
    }

    default:
      return false;
  }
}

/* ==========================================================================
   ERROR ROUTING
   ========================================================================== */

function handleMessageError(
  html,
  message,
  error
) {
  console.error(
    `[Home] ${
      message.source ||
      "Unknown source"
    } / ${
      message.type ||
      "Unknown message"
    } failed.`,
    error
  );

  if (
    message.source === HOME_SOURCE
  ) {
    postHomeError(
      html,
      error
    );

    return;
  }

  if (
    message.source === FOOTER_SOURCE &&
    message.type ===
      "FOOTER_NEWSLETTER_SIGNUP"
  ) {
    postToHtml(
      html,
      "FOOTER_NEWSLETTER_RESULT",
      {
        ok: false,
        message:
          error?.message ||
          "Newsletter signup failed."
      }
    );

    return;
  }

  if (
    message.source === HEADER_SOURCE
  ) {
    postToHtml(
      html,
      "CUSTOMER_HEADER_STATE",
      createGuestHeaderState()
    );
  }
}

/* ==========================================================================
   PAGE INITIALIZATION
   ========================================================================== */

$w.onReady(function () {
  const html =
    getHtmlComponent();

  if (!html) {
    return;
  }

  html.onMessage(async (event) => {
    const message =
      parseMessage(event.data);

    if (
      !message ||
      !message.source ||
      !message.type
    ) {
      return;
    }

    try {
      if (
        message.source === HOME_SOURCE
      ) {
        await handleHomeMessage(
          html,
          message
        );

        return;
      }

      if (
        message.source === HEADER_SOURCE
      ) {
        await handleHeaderMessage(
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
        `[Home] Ignored message from unknown source: ${
          message.source
        }`
      );
    } catch (error) {
      handleMessageError(
        html,
        message,
        error
      );
    }
  });
});
