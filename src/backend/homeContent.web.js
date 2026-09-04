import wixLocationFrontend from "wix-location-frontend";
import { authentication } from "wix-members-frontend";
import {
  getHomeBootstrap,
  searchUnifiedOffers,
  createBookingCartFromOffer
} from "backend/bookingOrchestrator.web";
import { getOldStyleHomeContent } from "backend/homeContent.web";

const EMBED_ID = "#htmlHome";
const HOME_SOURCE = "SKANDI_HOME_OLD_STYLE";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

let bootstrapPromise = null;
let currentSettings = { language: "EN", currency: "USD" };

const SUPPORTED_LANGUAGES = ["EN", "SV", "NO", "DA", "ES", "FI", "FR-FR", "FR-CA", "DE", "TH"];
const SUPPORTED_CURRENCIES = ["USD", "SEK", "NOK", "DKK", "EUR"];

function normalizeSettings(value = {}) {
  const language = String(value?.language || "").trim().toUpperCase();
  const currency = String(value?.currency || "").trim().toUpperCase();
  return {
    language: SUPPORTED_LANGUAGES.includes(language) ? language : "EN",
    currency: SUPPORTED_CURRENCIES.includes(currency) ? currency : "USD"
  };
}

function getHtmlComponent() {
  try {
    const html = $w(EMBED_ID);
    if (!html || typeof html.onMessage !== "function" || typeof html.postMessage !== "function") {
      console.error(`[Home] ${EMBED_ID} is not configured as a Wix HTML Component.`);
      return null;
    }
    return html;
  } catch (error) {
    console.error(`[Home] HTML Component ${EMBED_ID} was not found.`, error);
    return null;
  }
}

function parseMessage(data) {
  if (typeof data === "string") {
    try { return JSON.parse(data); }
    catch (error) {
      console.warn("[Home] Ignored an invalid JSON message.", error);
      return null;
    }
  }
  return data && typeof data === "object" ? data : null;
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
  postToHtml(html, "HOME_ERROR", {
    message: error?.message || "The request could not be completed."
  });
}

function navigateTo(rawPath) {
  const path = String(rawPath || "").trim();
  if (!path) return;
  const validTarget = path.startsWith("/") || /^https?:\/\//i.test(path) || /^mailto:/i.test(path) || /^tel:/i.test(path);
  if (!validTarget) {
    console.warn(`[Home] Blocked invalid navigation target: ${path}`);
    return;
  }
  try { wixLocationFrontend.to(path); }
  catch (error) { console.error(`[Home] Navigation failed for ${path}.`, error); }
}

async function sendHomeBootstrap(html, forceRefresh = false, settingsOverride = null) {
  if (bootstrapPromise && !forceRefresh) return bootstrapPromise;
  if (settingsOverride) currentSettings = normalizeSettings(settingsOverride);

  bootstrapPromise = (async () => {
    try {
      const request = {
        locale: currentSettings.language,
        language: currentSettings.language,
        currency: currentSettings.currency
      };
      const [booking, content] = await Promise.all([
        getHomeBootstrap(request),
        getOldStyleHomeContent(request)
      ]);
      postToHtml(html, "HOME_BOOTSTRAP_RESULT", {
        booking: booking || {},
        content: content || {},
        settings: currentSettings
      });
    } catch (error) {
      console.error("[Home] Bootstrap failed.", error);
      postHomeError(html, error);
    } finally {
      bootstrapPromise = null;
    }
  })();
  return bootstrapPromise;
}

async function handleHomeMessage(html, message) {
  const payload = message.payload || {};

  switch (message.type) {
    case "HOME_READY":
    case "HOME_SETTINGS_CHANGED":
      currentSettings = normalizeSettings(
        message.settings || payload.settings || currentSettings
      );
      await sendHomeBootstrap(
        html,
        message.type === "HOME_SETTINGS_CHANGED",
        currentSettings
      );
      if (message.type === "HOME_SETTINGS_CHANGED") {
        postToHtml(html, "HOME_SETTINGS_APPLIED", { settings: currentSettings });
      }
      return true;

    case "HOME_REFRESH":
      await sendHomeBootstrap(html, true, currentSettings);
      return true;

    case "HOME_SEARCH": {
      const rawSearch = message.search || payload.search || {};
      const search = {
        ...rawSearch,
        locale: rawSearch.locale || currentSettings.language,
        language: rawSearch.language || currentSettings.language,
        currency: rawSearch.currency || currentSettings.currency
      };
      const result = await searchUnifiedOffers({ search });
      postToHtml(html, "HOME_SEARCH_RESULT", {
        ...(result || {}),
        items: Array.isArray(result?.items) ? result.items : []
      });
      return true;
    }

    case "HOME_SELECT_OFFER": {
      const offer = message.offer || payload.offer || {};
      const search = message.search || payload.search || offer.searchContext || {};
      let result = await createBookingCartFromOffer({ offer, search });

      if (result?.requiresLogin) {
        try { await authentication.promptLogin(); }
        catch (_) {
          postHomeError(html, { message: "Sign in was cancelled. The offer was not saved." });
          return true;
        }
        result = await createBookingCartFromOffer({ offer, search });
      }

      if (result?.requiresLogin) {
        throw new Error(result?.message || "Sign in to continue with this offer.");
      }
      if (!result?.cartId) {
        throw new Error("The booking cart was not created because no cart ID was returned.");
      }

      postToHtml(html, "HOME_NAVIGATE_TO_OFFER", result);

      // IMPORTANT: use the backend-generated path so the private cart token
      // survives the transition from Home into the booking flow.
      if (result?.nextPath) {
        navigateTo(result.nextPath);
        return true;
      }

      const allowedSteps = ["offer", "extras", "transfer", "apis", "seats", "payment", "confirmation"];
      const step = allowedSteps.includes(result?.step) ? result.step : "offer";
      const token = result?.cartAccessToken || "";
      navigateTo(
        `/booking?step=${encodeURIComponent(step)}&cartId=${encodeURIComponent(result.cartId)}` +
        (token ? `&cartToken=${encodeURIComponent(token)}` : "")
      );
      return true;
    }

    case "HOME_NAVIGATE": {
      const path = String(message.path || payload.path || "").trim();
      navigateTo(path);
      return true;
    }

    default:
      return false;
  }
}

$w.onReady(function () {
  const html = getHtmlComponent();
  if (!html) return;

  html.onMessage(async (event) => {
    const message = parseMessage(event.data);
    if (!message || !message.source || !message.type) return;
    if (message.source !== HOME_SOURCE) return;
    try {
      await handleHomeMessage(html, message);
    } catch (error) {
      console.error(`[Home] ${message.type} failed.`, error);
      postHomeError(html, error);
    }
  });
});
