import wixLocationFrontend from "wix-location-frontend";

import {
  currentMember,
  authentication
} from "wix-members-frontend";

import {
  getTravelInfoPayload,
  createTravelInfoSupportRequest,
  askTravelInfoAgent,
  getTravelWeather
} from "backend/travelInfoService.web";

import {
  getCustomerHeaderSession,
  subscribeCustomerNewsletter
} from "backend/customerHeader.web";

/*
 * Wix page: /travel-info
 * HTML Component ID: #travelInfoHtml
 *
 * This page code supports:
 * - Travel Info content and weather
 * - Alexandra travel-information assistant
 * - Support requests
 * - Locked SKANDI customer header
 * - Language and currency settings
 * - Locked SKANDI customer footer
 */
const HTML_ID = "#travelInfoHtml";

const TRAVEL_INFO_SOURCE = "SKANDI_PUBLIC_TRAVEL_INFO";
const HEADER_SOURCE = "SKANDI_CUSTOMER_HEADER_EXPANDBAR";
const FOOTER_SOURCE = "SKANDI_CUSTOMER_FOOTER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

let travelInfoPromise = null;
let headerPromise = null;

/* ========================================================================== 
   HTML COMPONENT HELPERS
   ========================================================================== */

function getHtmlComponent() {
  try {
    const html = $w(HTML_ID);

    if (
      !html ||
      typeof html.onMessage !== "function" ||
      typeof html.postMessage !== "function"
    ) {
      console.error(
        `[Travel Info] ${HTML_ID} is not configured as a Wix HTML Component.`
      );

      return null;
    }

    return html;
  } catch (error) {
    console.error(
      `[Travel Info] HTML Component ${HTML_ID} was not found.`,
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
        "[Travel Info] Ignored an invalid JSON message.",
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

function closeHeaderPanels(html) {
  postToHtml(
    html,
    "CLOSE_CUSTOMER_HEADER_PANELS",
    {}
  );
}

/* ========================================================================== 
   OPTIONAL WIX WEATHER ELEMENTS
   ========================================================================== */

function safeSetText(selector, value) {
  try {
    const element = $w(selector);
    if (element && "text" in element) {
      element.text = String(value || "");
    }
  } catch (_) {
    // Optional Wix element is not present on this page.
  }
}

function safeSetImage(selector, src) {
  try {
    const element = $w(selector);
    if (element && src) {
      element.src = src;
    }
  } catch (_) {
    // Optional Wix element is not present on this page.
  }
}

function updateOptionalWixWeatherElements(
  weatherPayload = {}
) {
  const locations = Array.isArray(
    weatherPayload?.locations
  )
    ? weatherPayload.locations
    : [];

  const stockholm =
    locations.find(
      (item) => item?.locationId === "STOCKHOLM"
    ) ||
    locations.find(
      (item) => String(item?.title || item?.label || "")
        .toLowerCase()
        .includes("stockholm")
    ) ||
    locations[0];

  if (!stockholm || stockholm.ok === false) {
    safeSetText(
      "#weatherText",
      "Weather unavailable"
    );

    safeSetText(
      "#weatherDesc",
      ""
    );

    return;
  }

  safeSetText(
    "#weatherText",
    `${stockholm.title || stockholm.label || "Stockholm"}: ${
      stockholm.displayTemp ||
      (Number.isFinite(stockholm.tempC)
        ? `${Math.round(stockholm.tempC)}°C`
        : "")
    }`
  );

  safeSetText(
    "#weatherDesc",
    stockholm.description ||
    stockholm.condition ||
    ""
  );

  safeSetImage(
    "#weatherIcon",
    stockholm.iconUrl || ""
  );
}

/* ========================================================================== 
   NAVIGATION
   ========================================================================== */

function navigateTo(
  html,
  rawPath
) {
  const path = String(rawPath || "").trim();

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
      `[Travel Info] Blocked invalid navigation target: ${path}`
    );

    return;
  }

  closeHeaderPanels(html);

  try {
    wixLocationFrontend.to(path);
  } catch (error) {
    console.error(
      `[Travel Info] Navigation failed for ${path}.`,
      error
    );
  }
}

/* ========================================================================== 
   CUSTOMER HEADER
   ========================================================================== */

function guestHeaderState() {
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
          guestHeaderState()
        );

        return;
      }

      const session =
        await getCustomerHeaderSession();

      postToHtml(
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
        "[Travel Info] Could not load customer header state.",
        error
      );

      postToHtml(
        html,
        "CUSTOMER_HEADER_STATE",
        guestHeaderState()
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
  const payload = message.payload || {};
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
        console.info(
          "[Travel Info] Login was cancelled or incomplete.",
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
          "[Travel Info] Logout returned an error.",
          error
        );
      }

      postToHtml(
        html,
        "CUSTOMER_HEADER_STATE",
        guestHeaderState()
      );

      wixLocationFrontend.to("/home");
      return true;

    case "UPDATE_SETTINGS":
      /*
       * Language and currency are persisted by the HTML
       * Component in localStorage.
       */
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
  const payload = message.payload || {};
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

            message:
              result?.status === "updated"
                ? "Your subscription is already active."
                : "Thank you for subscribing.",

            ...(result || {})
          }
        );
      } catch (error) {
        console.error(
          "[Travel Info] Newsletter signup failed.",
          error
        );

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
      }

      return true;
    }

    default:
      return false;
  }
}

/* ========================================================================== 
   TRAVEL INFO DATA AND WEATHER
   ========================================================================== */

async function buildTravelInfoPayload() {
  const sourcePayload =
    await getTravelInfoPayload();

  const payload = {
    ...(sourcePayload || {})
  };

  try {
    const weather =
      await getTravelWeather({});

    payload.weather = weather || {
      ok: false,
      source: "OPENWEATHER",
      locations: []
    };

    updateOptionalWixWeatherElements(
      payload.weather
    );
  } catch (error) {
    payload.weather = {
      ok: false,
      source: "OPENWEATHER",
      locations: [],
      error:
        error?.message ||
        "Weather unavailable"
    };

    updateOptionalWixWeatherElements(
      payload.weather
    );
  }

  return payload;
}

async function sendTravelInfoData(
  html,
  forceRefresh = false
) {
  if (
    travelInfoPromise &&
    !forceRefresh
  ) {
    return travelInfoPromise;
  }

  travelInfoPromise = (async () => {
    try {
      postToHtml(
        html,
        "TRAVEL_INFO_PROGRESS",
        {
          message:
            "Loading SKANDI travel information..."
        }
      );

      const payload =
        await buildTravelInfoPayload();

      postToHtml(
        html,
        "TRAVEL_INFO_DATA",
        payload
      );
    } catch (error) {
      console.error(
        "[Travel Info] Could not load Travel Info data.",
        error
      );

      postToHtml(
        html,
        "TRAVEL_INFO_ERROR",
        {
          message:
            "Travel information is temporarily unavailable."
        }
      );
    } finally {
      travelInfoPromise = null;
    }
  })();

  return travelInfoPromise;
}

/* ========================================================================== 
   TRAVEL INFO ACTIONS
   ========================================================================== */

async function handleTravelInfoMessage(
  html,
  message
) {
  const payload = message.payload || {};

  switch (message.type) {
    case "TRAVEL_INFO_HTML_READY":
      await sendTravelInfoData(html);
      return true;

    case "TRAVEL_INFO_REFRESH":
      await sendTravelInfoData(
        html,
        true
      );

      return true;

    case "TRAVEL_INFO_NAVIGATE":
      navigateTo(
        html,
        message.path || payload.path
      );

      return true;

    case "OPEN_SUPPORT":
    case "open_support_popup":
      /*
       * The standardized HTML opens its own support modal.
       * No Wix lightbox is required.
       */
      return true;

    case "TRAVEL_INFO_AI_ASK":
      try {
        const result =
          await askTravelInfoAgent(payload);

        postToHtml(
          html,
          "TRAVEL_INFO_AI_RESULT",
          result || {
            ok: false,
            answer:
              "Alexandra is temporarily unavailable."
          }
        );
      } catch (error) {
        console.error(
          "[Travel Info] Alexandra request failed.",
          error
        );

        postToHtml(
          html,
          "TRAVEL_INFO_AI_RESULT",
          {
            ok: false,
            answer:
              "Alexandra is temporarily unavailable. Please try again or contact SKANDI support."
          }
        );
      }

      return true;

    case "TRAVEL_SUPPORT_REQUEST":
      try {
        const result =
          await createTravelInfoSupportRequest(
            payload
          );

        postToHtml(
          html,
          "TRAVEL_SUPPORT_RESULT",
          result || {
            ok: true,
            message:
              "Your request has been received."
          }
        );
      } catch (error) {
        console.error(
          "[Travel Info] Support request failed.",
          error
        );

        postToHtml(
          html,
          "TRAVEL_SUPPORT_RESULT",
          {
            ok: false,
            message:
              "Could not submit the request. Please try again."
          }
        );
      }

      return true;

    case "TRAVEL_INFO_INFLIGHT_CTA": {
      const airlineCode = String(
        payload.airlineCode || ""
      ).trim();

      const classId = String(
        payload.classId || ""
      ).trim();

      const query = new URLSearchParams();

      if (airlineCode) {
        query.set("airline", airlineCode);
      }

      if (classId) {
        query.set("cabin", classId);
      }

      navigateTo(
        html,
        query.toString()
          ? `/flights?${query.toString()}`
          : "/flights"
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
    `[Travel Info] ${
      message.source ||
      "Unknown source"
    } / ${
      message.type ||
      "Unknown message"
    } failed.`,
    error
  );

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
      guestHeaderState()
    );

    return;
  }

  postToHtml(
    html,
    "TRAVEL_INFO_ERROR",
    {
      message:
        error?.message ||
        "Travel Info action failed."
    }
  );
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
      !message.source ||
      !message.type
    ) {
      return;
    }

    try {
      if (
        message.source === TRAVEL_INFO_SOURCE
      ) {
        await handleTravelInfoMessage(
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
        `[Travel Info] Ignored message from unknown source: ${
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

  /*
   * Initial bootstrap. Promise guards prevent duplicate
   * calls when the HTML immediately sends its READY events.
   */
  Promise.all([
    sendTravelInfoData(html),
    sendHeaderState(html)
  ]).catch((error) => {
    console.error(
      "[Travel Info] Initial bootstrap failed.",
      error
    );
  });
});

export function contactSupport() {
  wixLocationFrontend.to("/help");
}
