// Wix popup page code
// Popup name: Language & Currency
// HTML Component ID: #languageCurrencyPopupHtml

import wixWindowFrontend from "wix-window-frontend";
import { local } from "wix-storage-frontend";

const HTML_ID = "#languageCurrencyPopupHtml";
const CHILD_SOURCE = "SKANDI_LANGUAGE_CURRENCY_POPUP";
const PARENT_SOURCE = "SKANDI_WIX_POPUP";

const STORAGE_KEY = "skandi_user_settings";
const LANGUAGES = new Set(["EN","SV","NO","DA"]);
const CURRENCIES = new Set(["USD","SEK","NOK","DKK","EUR"]);

let html = null;

function normalize(value = {}, requireValid = false) {
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

  const languageValid =
    LANGUAGES.has(language);

  const currencyValid =
    CURRENCIES.has(currency);

  if (
    requireValid &&
    (
      !languageValid ||
      !currencyValid
    )
  ) {
    return null;
  }

  return {
    language:
      languageValid
        ? language
        : "EN",

    currency:
      currencyValid
        ? currency
        : "USD"
  };
}

function readStored() {
  try {
    const raw =
      local.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(raw);

    if (
      !parsed ||
      parsed.confirmed !== true
    ) {
      return null;
    }

    return normalize(
      parsed,
      true
    );
  } catch (_) {
    return null;
  }
}

function writeStored(settings) {
  const value =
    normalize(
      settings,
      true
    );

  if (!value) {
    throw new Error(
      "INVALID_CUSTOMER_SETTINGS"
    );
  }

  local.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...value,
      confirmed:true,
      version:4,
      updatedAt:
        new Date().toISOString()
    })
  );

  return value;
}

function popupContext() {
  try {
    const context =
      wixWindowFrontend.lightbox
        .getContext() || {};

    return (
      context &&
      typeof context === "object"
        ? context
        : {}
    );
  } catch (_) {
    return {};
  }
}

function post(type, payload = {}) {
  if (
    !html ||
    typeof html.postMessage !== "function"
  ) {
    return;
  }

  html.postMessage({
    source:PARENT_SOURCE,
    type,
    payload,
    timestamp:new Date().toISOString()
  });
}

function sendBootstrap() {
  const context =
    popupContext();

  const value =
    normalize(
      context?.settings ||
      context ||
      readStored() ||
      {}
    );

  post(
    "SETTINGS_POPUP_BOOTSTRAP",
    value
  );
}

$w.onReady(function () {
  const context =
    popupContext();

  const stored =
    readStored();

  const openedByMaster =
    context?.source ===
    "SKANDI_MASTERPAGE";

  // If Wix is still configured to auto-display this popup, do not
  // show it again after a confirmed preference already exists.
  if (
    stored &&
    !openedByMaster
  ) {
    wixWindowFrontend.lightbox.close({
      ok:false,
      skipped:true,
      ...stored
    });

    return;
  }

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
      message.source !==
      CHILD_SOURCE
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
            writeStored(
              message.payload || {}
            );

          wixWindowFrontend.lightbox.close({
            ok:true,
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
