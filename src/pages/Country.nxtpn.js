import wixLocationFrontend from "wix-location-frontend";
import { currentMember, authentication } from "wix-members-frontend";
import {
  getCustomerHeaderSession,
  subscribeCustomerNewsletter
} from "backend/customerHeader.web";
import {
  getCountryPage,
  searchCountryOffers
} from "backend/FINAL/countryInventoryPage.web";

const EMBED_ID = "#countryDestinationHtml";
const COUNTRY_SOURCE = "SKANDI_DYNAMIC_COUNTRY_PAGE";
const HEADER_SOURCE = "SKANDI_CUSTOMER_HEADER_EXPANDBAR";
const FOOTER_SOURCE = "SKANDI_CUSTOMER_FOOTER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

const SUPPORTED_LANGUAGES = new Set([
  "EN", "SV", "NO", "DA", "ES", "FI", "DE", "FR-FR", "FR-CA", "TH"
]);
const SUPPORTED_CURRENCIES = new Set(["USD", "SEK", "NOK", "DKK", "EUR"]);

let html = null;
let currentSettings = { language: "EN", currency: "USD" };
let countryLoadToken = 0;

function clean(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function slugify(value) {
  return clean(value, 180)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseMessage(value) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (_) {
      return null;
    }
  }
  return value && typeof value === "object" ? value : null;
}

function normalizeSettings(value = {}) {
  const language = clean(value.language, 20).toUpperCase();
  const currency = clean(value.currency, 10).toUpperCase();
  return {
    language: SUPPORTED_LANGUAGES.has(language) ? language : "EN",
    currency: SUPPORTED_CURRENCIES.has(currency) ? currency : "USD"
  };
}

function routeCountrySlug() {
  return slugify(wixLocationFrontend.query?.country || "");
}

function post(type, payload = {}) {
  if (!html || typeof html.postMessage !== "function") return;
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
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

function closeHeaderPanels() {
  post("CLOSE_CUSTOMER_HEADER_PANELS", {});
}

function safeRelativePath(rawPath) {
  const path = clean(rawPath, 1500);
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return "";
  }
  if (/^\/_(?:functions|api)(?:\/|$)/i.test(path)) return "";
  if (/^\/riaintra(?:\/|$)/i.test(path)) return "/riaintra";
  return path;
}

function navigate(rawPath) {
  const path = safeRelativePath(rawPath);
  if (!path) return;
  closeHeaderPanels();
  wixLocationFrontend.to(path);
}

async function sendHeaderState() {
  try {
    const member = await currentMember.getMember();
    if (!member) {
      post("CUSTOMER_HEADER_STATE", guestHeaderState());
      return;
    }

    const session = await getCustomerHeaderSession();
    post("CUSTOMER_HEADER_STATE", {
      loggedIn: true,
      displayName:
        session?.displayName ||
        session?.name ||
        session?.member?.displayName ||
        member?.profile?.nickname ||
        member?.profile?.title ||
        member?.loginEmail ||
        "",
      points: Number(session?.points || session?.clubPoints || session?.rewards?.points || 0),
      tierName: session?.tierName || session?.tier || session?.clubTier || "",
      menu: Array.isArray(session?.menu) ? session.menu : []
    });
  } catch (error) {
    console.error("[Country] Could not load customer header state.", error);
    post("CUSTOMER_HEADER_STATE", guestHeaderState());
  }
}

async function loadCountry(requestedSlug = "", settings = currentSettings) {
  const token = ++countryLoadToken;
  currentSettings = normalizeSettings(settings);

  // The Wix page URL is authoritative. The HTML iframe URL does not inherit
  // /our-destinations/country?country=... and may therefore send an empty slug.
  const countrySlug = routeCountrySlug() || slugify(requestedSlug);

  if (!countrySlug) {
    throw new Error("COUNTRY_SLUG_REQUIRED");
  }

  const result = await getCountryPage({
    slug: countrySlug,
    language: currentSettings.language,
    locale: currentSettings.language,
    currency: currentSettings.currency
  });

  if (token !== countryLoadToken) return;

  if (!result?.ok || !result?.page) {
    throw new Error(result?.message || result?.error || "COUNTRY_PAGE_INVALID_RESPONSE");
  }

  post("COUNTRY_PAGE_RESULT", {
    page: result.page
  });
}

async function handleCountryMessage(message) {
  const payload = message.payload || {};

  switch (message.type) {
    case "COUNTRY_READY":
      currentSettings = normalizeSettings(payload.settings || currentSettings);
      await loadCountry(payload.slug, currentSettings);
      return true;

    case "UPDATE_SETTINGS":
      currentSettings = normalizeSettings(payload);
      await loadCountry(payload.slug, currentSettings);
      return true;

    case "COUNTRY_SELECT_COUNTRY": {
      const nextSlug = slugify(payload.slug);
      if (!nextSlug) return true;
      navigate(`/our-destinations/country?country=${encodeURIComponent(nextSlug)}`);
      return true;
    }

    case "COUNTRY_SEARCH_OFFERS": {
      const countrySlug = routeCountrySlug() || slugify(payload.countrySlug);
      const result = await searchCountryOffers({
        countrySlug,
        search: {
          ...(payload.search || {}),
          language: currentSettings.language,
          locale: currentSettings.language,
          currency: currentSettings.currency
        }
      });

      post("COUNTRY_OFFERS_RESULT", {
        items: Array.isArray(result?.items) ? result.items : []
      });
      return true;
    }

    case "COUNTRY_SELECT_OFFER": {
      const offer = payload.offer || {};
      if (offer.path) navigate(offer.path);
      return true;
    }

    case "COUNTRY_NAVIGATE":
      navigate(payload.path || message.path);
      return true;

    default:
      return false;
  }
}

async function handleHeaderMessage(message) {
  const payload = message.payload || {};
  const path = clean(message.path || payload.path, 1500);

  switch (message.type) {
    case "HEADER_READY":
      await sendHeaderState();
      return true;

    case "HEADER_NAVIGATE":
      navigate(path);
      return true;

    case "HEADER_SEARCH":
      navigate("/search");
      return true;

    case "HEADER_LOGIN":
      closeHeaderPanels();
      try {
        await authentication.promptLogin();
      } catch (error) {
        console.info("[Country] Login cancelled or incomplete.", error);
      }
      await sendHeaderState();
      return true;

    case "HEADER_LOGOUT":
      closeHeaderPanels();
      try {
        await Promise.resolve(authentication.logout());
      } catch (error) {
        console.warn("[Country] Logout returned an error.", error);
      }
      post("CUSTOMER_HEADER_STATE", guestHeaderState());
      wixLocationFrontend.to("/home");
      return true;

    default:
      return false;
  }
}

async function handleFooterMessage(message) {
  const payload = message.payload || {};
  const path = clean(message.path || payload.path, 1500);

  switch (message.type) {
    case "FOOTER_READY":
      post("CUSTOMER_FOOTER_STATE", { ready: true });
      return true;

    case "FOOTER_NAVIGATE":
      navigate(path);
      return true;

    case "FOOTER_STAFF_LOGIN":
      navigate("/riaintra");
      return true;

    case "FOOTER_NEWSLETTER_SIGNUP": {
      const email = clean(message.email || payload.email, 254);
      if (!email) {
        post("FOOTER_NEWSLETTER_RESULT", {
          ok: false,
          code: "EMAIL_REQUIRED",
          message: "Please enter your email address."
        });
        return true;
      }

      try {
        const result = await subscribeCustomerNewsletter({
          email,
          source: payload.source || "Country Footer"
        });

        post("FOOTER_NEWSLETTER_RESULT", {
          ok: true,
          code: result?.status === "updated" ? "ALREADY_ACTIVE" : "SUBSCRIBED",
          message:
            result?.status === "updated"
              ? "Your subscription is already active."
              : "Thank you for subscribing.",
          ...(result || {})
        });
      } catch (error) {
        console.error("[Country] Newsletter signup failed.", error);
        post("FOOTER_NEWSLETTER_RESULT", {
          ok: false,
          code: "SUBSCRIBE_FAILED",
          message: "Newsletter signup failed."
        });
      }
      return true;
    }

    default:
      return false;
  }
}

$w.onReady(() => {
  try {
    html = $w(EMBED_ID);
  } catch (error) {
    console.error(`[Country] ${EMBED_ID} was not found.`, error);
    return;
  }

  if (!html || typeof html.onMessage !== "function" || typeof html.postMessage !== "function") {
    console.error(`[Country] ${EMBED_ID} is not a Wix HTML Component.`);
    return;
  }

  html.onMessage(async (event) => {
    const message = parseMessage(event.data);
    if (!message) return;

    try {
      if (message.source === COUNTRY_SOURCE) {
        await handleCountryMessage(message);
        return;
      }

      if (message.source === HEADER_SOURCE) {
        await handleHeaderMessage(message);
        return;
      }

      if (message.source === FOOTER_SOURCE) {
        await handleFooterMessage(message);
      }
    } catch (error) {
      console.error("[Country] Bridge action failed.", {
        type: message.type,
        error
      });

      post("COUNTRY_ERROR", {
        code: clean(error?.code || error?.message || "COUNTRY_PAGE_FAILED", 120),
        message: clean(error?.publicMessage || error?.message || "Country page failed.", 500)
      });
    }
  });

  // Push header state even if the embed's HEADER_READY arrives before the
  // listener is attached. COUNTRY_READY will trigger the actual page load.
  sendHeaderState().catch((error) => {
    console.warn("[Country] Initial header state failed.", error);
  });
});
