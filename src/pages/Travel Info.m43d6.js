import wixLocationFrontend from "wix-location-frontend";

import {
  getTravelInfoPayload,
  createTravelInfoSupportRequest,
  askTravelInfoAgent,
  getTravelWeather
} from "backend/travelInfoService.web";

/*
 * Wix page: /travel-info
 * HTML Component ID: #travelInfoHtml
 *
 * Global SKANDI customer header/footer are controlled by masterPage.js.
 * This page code handles Travel Info only:
 * - Supabase-backed public content
 * - OpenWeather payload
 * - Alexandra
 * - Support requests
 * - Travel Info navigation
 */

const HTML_ID = "#travelInfoHtml";
const TRAVEL_INFO_SOURCE = "SKANDI_PUBLIC_TRAVEL_INFO";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

let travelInfoPromise = null;

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
        "[Travel Info] Ignored invalid JSON from HTML Component.",
        error
      );
      return null;
    }
  }

  return data && typeof data === "object"
    ? data
    : null;
}

function postToHtml(html, type, payload = {}) {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
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
  } catch (_) {}
}

function safeSetImage(selector, src) {
  try {
    const element = $w(selector);
    if (element && src) {
      element.src = src;
    }
  } catch (_) {}
}

function updateOptionalWixWeatherElements(weatherPayload = {}) {
  const locations = Array.isArray(weatherPayload?.locations)
    ? weatherPayload.locations
    : [];

  const stockholm =
    locations.find((item) => item?.locationId === "STOCKHOLM") ||
    locations.find((item) =>
      String(item?.title || item?.label || "")
        .toLowerCase()
        .includes("stockholm")
    ) ||
    locations[0];

  if (!stockholm || stockholm.ok === false) {
    safeSetText("#weatherText", "Weather unavailable");
    safeSetText("#weatherDesc", "");
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

function navigateTo(rawPath) {
  const path = String(rawPath || "").trim();

  if (!path) return;

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
   DATA
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
    console.warn(
      "[Travel Info] Weather is unavailable.",
      error
    );

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
            "Loading SKANDI Travel Information..."
        }
      );

      const payload =
        await buildTravelInfoPayload();

      console.log(
        "[Travel Info] Payload loaded.",
        payload?.meta || {
          airlines:
            Object.keys(payload?.airlines || {}).length,
          airports:
            Array.isArray(payload?.airports)
              ? payload.airports.length
              : 0
        }
      );

      postToHtml(
        html,
        "TRAVEL_INFO_DATA",
        payload
      );
    } catch (error) {
      console.error(
        "[Travel Info] Supabase payload failed.",
        error
      );

      postToHtml(
        html,
        "TRAVEL_INFO_ERROR",
        {
          code:
            "TRAVEL_INFO_LOAD_FAILED",
          message:
            error?.message ||
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
   HTML ACTIONS
   ========================================================================== */

async function handleTravelInfoMessage(
  html,
  message
) {
  const payload =
    message.payload || {};

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
        message.path ||
        payload.path
      );
      return true;

    case "OPEN_SUPPORT":
    case "open_support_popup":
      return true;

    case "TRAVEL_INFO_AI_ASK": {
      try {
        const result =
          await askTravelInfoAgent(
            payload
          );

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
          "[Travel Info] Alexandra failed.",
          error
        );

        postToHtml(
          html,
          "TRAVEL_INFO_AI_RESULT",
          {
            ok: false,
            answer:
              "Alexandra is temporarily unavailable. Please contact SKANDI support."
          }
        );
      }

      return true;
    }

    case "TRAVEL_SUPPORT_REQUEST": {
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
              error?.message ||
              "Could not submit the request."
          }
        );
      }

      return true;
    }

    case "TRAVEL_INFO_INFLIGHT_CTA": {
      const airlineCode =
        String(payload.airlineCode || "")
          .trim();

      const classId =
        String(payload.classId || "")
          .trim();

      const query =
        new URLSearchParams();

      if (airlineCode) {
        query.set(
          "airline",
          airlineCode
        );
      }

      if (classId) {
        query.set(
          "cabin",
          classId
        );
      }

      navigateTo(
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

    // Header and footer are handled globally by masterPage.js.
    if (
      message.source !==
      TRAVEL_INFO_SOURCE
    ) {
      return;
    }

    try {
      await handleTravelInfoMessage(
        html,
        message
      );
    } catch (error) {
      console.error(
        `[Travel Info] ${message.type} failed.`,
        error
      );

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
  });

  /*
   * Bootstrap from the Wix page as well as responding to HTML READY.
   * The promise guard prevents duplicate database requests.
   */
  sendTravelInfoData(html)
    .catch((error) => {
      console.error(
        "[Travel Info] Initial payload failed.",
        error
      );
    });
});

export function contactSupport() {
  wixLocationFrontend.to("/help");
}
