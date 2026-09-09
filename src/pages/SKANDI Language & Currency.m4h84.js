// Wix popup page code
// Popup name: Language & Currency
// HTML Component ID: #languageCurrencyPopupHtml

import wixWindowFrontend from "wix-window-frontend";

const HTML_ID = "#languageCurrencyPopupHtml";
const CHILD_SOURCE = "SKANDI_LANGUAGE_CURRENCY_POPUP";
const PARENT_SOURCE = "SKANDI_WIX_POPUP";

const LANGUAGES = ["EN","SV","NO","DA"];
const CURRENCIES = ["USD","SEK","NOK","DKK","EUR"];

let html = null;

function normalize(value = {}) {
  const source =
    value?.settings && typeof value.settings === "object"
      ? value.settings
      : value;

  const language =
    String(source?.language || "")
      .trim()
      .toUpperCase();

  const currency =
    String(source?.currency || "")
      .trim()
      .toUpperCase();

  return {
    language:
      LANGUAGES.includes(language)
        ? language
        : "EN",
    currency:
      CURRENCIES.includes(currency)
        ? currency
        : "USD"
  };
}

function post(type, payload = {}) {
  if (
    !html ||
    typeof html.postMessage !== "function"
  ) {
    return;
  }

  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function contextSettings() {
  try {
    const context =
      wixWindowFrontend.lightbox.getContext() || {};

    return normalize(
      context?.settings || context
    );
  } catch (_) {
    return normalize({});
  }
}

function sendBootstrap() {
  post(
    "SETTINGS_POPUP_BOOTSTRAP",
    contextSettings()
  );
}

$w.onReady(function () {
  try {
    html =
      $w(HTML_ID);
  } catch (error) {
    console.error(
      `[Language/Currency] Missing HTML Component ${HTML_ID}.`,
      error
    );
    return;
  }

  html.onMessage(async event => {
    const message =
      event?.data || {};

    if (
      message.source !== CHILD_SOURCE
    ) {
      return;
    }

    try {
      switch (message.type) {
        case "SETTINGS_POPUP_READY":
          sendBootstrap();
          return;

        case "SETTINGS_POPUP_SAVE": {
          const settings =
            normalize(message.payload || {});

          wixWindowFrontend.lightbox.close({
            ok: true,
            ...settings
          });

          return;
        }

        default:
          return;
      }
    } catch (error) {
      console.error(
        "[Language/Currency] Popup action failed.",
        error
      );

      post(
        "SETTINGS_POPUP_ERROR",
        {
          message:
            "Your preferences could not be saved. Please try again."
        }
      );
    }
  });

  setTimeout(
    sendBootstrap,
    80
  );
});
