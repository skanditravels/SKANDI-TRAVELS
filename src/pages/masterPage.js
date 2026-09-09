// masterPage.js
// SKANDI GLOBAL CHROME CONTROL
// Full replacement version with central language/currency persistence and sync.

import wixLocationFrontend from "wix-location-frontend";
import wixSiteFrontend from "wix-site-frontend";
import wixWindowFrontend from "wix-window-frontend";
import { local } from "wix-storage-frontend";

import {
  currentMember,
  authentication
} from "wix-members-frontend";

import {
  getCustomerHeaderSession,
  subscribeCustomerNewsletter
} from "backend/customerHeader.web";

import {
  getStaffPortalSession
} from "backend/RIA/staffPortalAuth.web";

const MASTER_VERSION = "2026.09.09.3";

const MASTER_CONFIG = Object.freeze({
  brand: Object.freeze({
    groupName: "SKANDI Group",
    travelName: "SKANDI Travels",
    internalName: "RIAINTRA",
    alteaName: "ALTEA",
    slogans: Object.freeze({
      en: "Unforgettable Moments",
      sv: "När du längtar bort",
      no: "Når du lengter bort",
      da: "Når du længes væk",
      fi: "Kun kaipaat pois",
      altea: "WE MAKE DOOR TO DOOR STAY IN SYNC"
    }),
    languages: Object.freeze(["EN", "SV", "NO", "DA"]),
    currencies: Object.freeze(["USD", "SEK", "NOK", "DKK", "EUR"]),
    assets: Object.freeze({
      logos: Object.freeze({
        customerHeader: "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",
        customerFooter: "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",
        skandiPrimary: "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",
        skandiWhite: "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",
        skandiTravels: "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",
        skandiWave: "",
        skandiGroup: "",
        riaintra: "https://static.wixstatic.com/media/394052_1024542c47664bff8f4e145d1adf472d~mv2.png",
        altea: "https://static.wixstatic.com/media/394052_46045c41aebf421d98314b31ef83c677~mv2.png",
        voy: "https://static.wixstatic.com/media/394052_30b8bebbf5ee493da7d47329d04de494~mv2.png",
        voyWhite: "https://static.wixstatic.com/media/394052_3770b6753c474d73a77c674b20eab305~mv2.png",
        skandiClub: "",
        signatureCollection: ""
      }),
      icons: Object.freeze({
        home: "",
        bookings: "",
        favorites: "",
        documents: "",
        travelers: "",
        wallet: "",
        support: "",
        settings: "",
        notifications: ""
      })
    })
  }),

  routes: Object.freeze({
    home: "/",
    search: "/search",
    flights: "/flights",
    carRental: "/car-rental",
    hotels: "/hotels",
    packages: "/packages",
    tours: "/tours",
    activities: "/activities",
    transfers: "/transfers",
    destinations: "/destinations",
    skandiCollection: "/skandi-collection",
    voy: "/voy-magazine",
    myTrip: "/my-profile?tab=trips",
    club: "/skandi-club",
    about: "/about",
    support: "/about/support",
    newsroom: "/about/news-room",
    theStore: "/the-store",
    storeCheckout: "/the-store/store-checkout",
    storeConfirmation: "/the-store/store-checkout/order-confirmation",
    ourNetwork: "/about/our-network",
    legal: "/about/legal",
    policies: "/about/legal/policies",
    riaintra: "/riaintra",
    staffLogin: "/riaintra",
    successFactors: "/riaintra/success-factors",
    alteaLaunchpad: "/riaintra/success-factors/altea",
    alteaReservations: "/riaintra/success-factors/altea/reservations",
    alteaTicketing: "/riaintra/success-factors/altea/ticketing",
    alteaTimatic: "/riaintra/success-factors/altea/timatic",
    mail: "/riaintra/success-factors/mail",
    docunet: "/riaintra/success-factors/docunet",
    serviceDesk: "/riaintra/success-factors/helpdesk",
    magazineManager: "/riaintra/success-factors/media-control"
  }),

  customer: Object.freeze({
    header: Object.freeze({
      primaryNav: Object.freeze([
        { id: "flights", label: "Flights", path: "/flights" },
        { id: "hotels", label: "Hotels", path: "/hotels" },
        { id: "packages", label: "Packages", path: "/packages" },
        { id: "tours", label: "Tours & Activities", path: "/tours" },
        { id: "transfers", label: "Transfers", path: "/transfers" }
      ]),
      secondaryNav: Object.freeze([
        { id: "destinations", label: "Destinations", path: "/destinations" },
        { id: "signature", label: "SKANDI Collection", path: "/skandi-collection" },
        { id: "voy", label: "VOY Magazine", path: "/voy-magazine" },
        { id: "newsroom", label: "Newsroom", path: "/about/news-room" }
      ]),
      accountNav: Object.freeze([
        { id: "myTrip", label: "My Trips", path: "/my-profile?tab=trips" },
        { id: "club", label: "SKANDI Club", path: "/skandi-club" }
      ])
    }),
    footer: Object.freeze({
      columns: Object.freeze([
        {
          title: "BOOK & TRAVEL",
          links: Object.freeze([
            { label: "Book a trip", path: "/" },
            { label: "Manage your booking", path: "/my-profile?tab=trips" },
            { label: "Our Destinations", path: "/destinations" },
            { label: "Flights", path: "/flights" },
            { label: "Hotels", path: "/hotels" },
            { label: "Tours & Activities", path: "/tours" },
            { label: "Car Rental", path: "/car-rental" },
            { label: "Airport Transfer", path: "/transfers" },
            { label: "Last Chance", path: "/offers" }
          ])
        },
        {
          title: "HELP & TRAVEL INFO",
          links: Object.freeze([
            { label: "Before you travel", path: "/travel-info" },
            { label: "Passport & Visa", path: "/travel-info/passport-visa" },
            { label: "Baggage Allowance", path: "/travel-info/baggage-allowance" },
            { label: "Travel Insurance", path: "/travel-info/insurance" },
            { label: "Special Assistance", path: "/travel-info/special-assistance" },
            { label: "Flight Status", path: "/travel-info/flight-status" },
            { label: "Help Center", path: "/about/support" }
          ])
        },
        {
          title: "SKANDI",
          links: Object.freeze([
            { label: "Join SKANDI Club", path: "/skandi-club" },
            { label: "Log In to My Club", path: "/my-profile" },
            { label: "SKANDI Collection", path: "/skandi-collection" },
            { label: "THE STORE", path: "/the-store" },
            { label: "VOY Magazine", path: "/voy-magazine" }
          ])
        },
        {
          title: "ABOUT SKANDI",
          links: Object.freeze([
            { label: "About SKANDI", path: "/about" },
            { label: "Careers", path: "/about/careers" },
            { label: "Newsroom", path: "/about/news-room" },
            { label: "Our Network", path: "/about/our-network" }
          ])
        }
      ]),
      staffLogin: Object.freeze({
        label: "Staff Login",
        path: "/riaintra"
      })
    })
  }),

  internal: Object.freeze({
    header: Object.freeze({
      productName: "SKANDI TRAVELS",
      productContext: "RIAINTRA Enterprise Workforce Suite",
      primaryNav: Object.freeze([
        { id: "success-factors", label: "SAP RIAINTRA Dashboard", path: "/riaintra/success-factors" },
        { id: "my-roster", label: "MyRoster", path: "/riaintra/success-factors/my-roster" },
        { id: "alteaLaunchpad", label: "ALTEA", path: "/riaintra/success-factors/altea" },
        { id: "mail", label: "Mail", path: "/riaintra/success-factors/mail" },
        { id: "docunet", label: "DocuNet", path: "/riaintra/success-factors/docunet" },
        { id: "service-desk", label: "ServiceDesk", path: "/riaintra/success-factors/helpdesk" }
      ]),
      managementNav: Object.freeze([
        { id: "magazine-manager", label: "Media Manager", path: "/riaintra/success-factors/media-control" }
      ])
    }),
    footer: Object.freeze({
      links: Object.freeze([
        { label: "RIAINTRA", path: "/riaintra" },
        { label: "DocuNet", path: "/riaintra/success-factors/docunet" },
        { label: "ServiceDesk", path: "/riaintra/success-factors/helpdesk" }
      ])
    })
  })
});

const CUSTOMER_HEADER_EMBED = "#skandiHeaderEmbed";
const CUSTOMER_HEADER_EMBED_LEGACY = "#skandiCustomerHeaderEmbed";
const CUSTOMER_FOOTER_EMBED = "#skandiFooterEmbed";
const CUSTOMER_FOOTER_EMBED_LEGACY = "#skandiCustomerFooterEmbed";
const RIAINTRA_HEADER_EMBED = "#riaintraHeaderEmbed";
const RIAINTRA_FOOTER_EMBED = "#riaintraFooterEmbed";
const ALTEA_HEADER_EMBED = "#alteaHeaderEmbed";

const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const CUSTOMER_HEADER_SOURCE = "SKANDI_CUSTOMER_HEADER_EXPANDBAR";
const CUSTOMER_FOOTER_SOURCE = "SKANDI_CUSTOMER_FOOTER";
const ALTEA_HEADER_SOURCE = "SKANDI_ALTEA_HEADER";

const INTERNAL_PREFIXES = ["/riaintra", "/altea", "/_functions"];
const GROUPTALK_CHROME_FREE_PATHS = Object.freeze([
  "/riaintra/success-factors/altea/grouptalk"
]);

const SETTINGS_STORAGE_KEY = "skandi_user_settings";
const SETTINGS_POPUP_NAME = "Language & Currency";
const SETTINGS_VERSION = 3;

const SUPPORTED_LANGUAGES = new Set(MASTER_CONFIG.brand.languages);
const SUPPORTED_CURRENCIES = new Set(MASTER_CONFIG.brand.currencies);

let alteaRuntimeContext = {};
let currentCustomerSettings = null;
let settingsPopupPromise = null;

function safeEl(id) {
  try {
    return $w(id);
  } catch (_) {
    return null;
  }
}

function firstExisting(...ids) {
  for (const id of ids) {
    const element = safeEl(id);
    if (element) return element;
  }
  return null;
}

function customerHeaderEl() {
  return firstExisting(
    CUSTOMER_HEADER_EMBED,
    CUSTOMER_HEADER_EMBED_LEGACY
  );
}

function customerFooterEl() {
  return firstExisting(
    CUSTOMER_FOOTER_EMBED,
    CUSTOMER_FOOTER_EMBED_LEGACY
  );
}

function allHtmlComponents() {
  try {
    const result = $w("HtmlComponent");
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (typeof result[Symbol.iterator] === "function") return Array.from(result);
    if (typeof result.length === "number") return Array.from(result);
    return [result];
  } catch (error) {
    console.warn("[MasterPage] Could not enumerate HTML Components.", error);
    return [];
  }
}

function currentWixPageInfo() {
  try {
    const page = wixSiteFrontend.currentPage || {};
    return {
      name: String(page.name || "").trim(),
      url: String(page.url || "").trim(),
      type: String(page.type || "").trim(),
      isHomePage: page.isHomePage === true
    };
  } catch (error) {
    console.warn("[MasterPage] Could not read wixSiteFrontend.currentPage.", error);
    return {
      name: "",
      url: "",
      type: "",
      isHomePage: false
    };
  }
}

function currentPathString() {
  const page = currentWixPageInfo();

  if (page.url && page.url.startsWith("/")) {
    return page.url.split("?")[0].replace(/\/+$/, "") || "/";
  }

  const path = wixLocationFrontend.path || [];
  return "/" + path.join("/");
}

function isInternalPath(path = currentPathString()) {
  const value = String(path || "").toLowerCase();
  return INTERNAL_PREFIXES.some(
    prefix => value === prefix || value.startsWith(prefix + "/")
  );
}

function isAlteaPath(path = currentPathString()) {
  const value = String(path || "").toLowerCase();
  const prefixes = [
    "/riaintra/success-factors/altea",
    "/riaintra/altea",
    "/altea"
  ];
  return prefixes.some(
    prefix => value === prefix || value.startsWith(prefix + "/")
  );
}

function isChromeFreeInternalPath(path = currentPathString()) {
  const value =
    String(path || "")
      .toLowerCase()
      .split("?")[0]
      .replace(/\/+$/, "") || "/";

  return GROUPTALK_CHROME_FREE_PATHS.some(
    groupTalkPath =>
      value === groupTalkPath ||
      value.startsWith(groupTalkPath + "/")
  );
}

function isSafeRoute(path) {
  const value = String(path || "").trim();

  return Boolean(
    value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !/^(javascript|data|vbscript):/i.test(value)
  );
}

function normalizeSettings(value = {}, requireValid = false) {
  const source =
    value?.settings && typeof value.settings === "object"
      ? value.settings
      : value;

  const language = String(source?.language || "").trim().toUpperCase();
  const currency = String(source?.currency || "").trim().toUpperCase();

  const languageValid = SUPPORTED_LANGUAGES.has(language);
  const currencyValid = SUPPORTED_CURRENCIES.has(currency);

  if (requireValid && (!languageValid || !currencyValid)) {
    return null;
  }

  return {
    language: languageValid ? language : "EN",
    currency: currencyValid ? currency : "USD"
  };
}

function readStoredSettings() {
  try {
    const raw = local.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      parsed.confirmed !== true
    ) {
      return null;
    }

    return normalizeSettings(parsed, true);
  } catch (error) {
    console.warn("[MasterPage] Could not read language/currency settings.", error);
    return null;
  }
}

function writeStoredSettings(value = {}) {
  const settings = normalizeSettings(value, true);

  if (!settings) {
    throw new Error("INVALID_CUSTOMER_SETTINGS");
  }

  const record = {
    ...settings,
    confirmed: true,
    version: SETTINGS_VERSION,
    updatedAt: new Date().toISOString()
  };

  local.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify(record)
  );

  currentCustomerSettings = settings;
  return settings;
}

function customerSettingsState() {
  const stored = readStoredSettings();

  if (stored) {
    currentCustomerSettings = stored;
  }

  const settings =
    currentCustomerSettings ||
    stored ||
    { language: "EN", currency: "USD" };

  return {
    ...settings,
    confirmed: Boolean(stored),
    version: SETTINGS_VERSION
  };
}

function postToEmbed(embed, type, payload = {}) {
  if (!embed || typeof embed.postMessage !== "function") return false;

  try {
    embed.postMessage({
      source: PARENT_SOURCE,
      type,
      payload,
      timestamp: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.warn(
      `[MasterPage] postMessage failed for ${embed.id || "unknown embed"}.`,
      error
    );
    return false;
  }
}

function masterPayload(extra = {}) {
  const page = currentWixPageInfo();
  const path = currentPathString();
  const altea = isAlteaPath(path);

  return {
    version: MASTER_VERSION,
    mode: isInternalPath(path) ? "internal" : "customer",
    isInternal: isInternalPath(path),
    isAltea: altea,
    currentPath: path,
    currentPage: page,
    brand: MASTER_CONFIG.brand,
    routes: MASTER_CONFIG.routes,
    customer: MASTER_CONFIG.customer,
    internal: MASTER_CONFIG.internal,
    settings: customerSettingsState(),
    altea: {
      ...(altea
        ? {
            systemName: page.name || "",
            pageName: page.name || "",
            pageUrl: page.url || ""
          }
        : {}),
      ...alteaRuntimeContext
    },
    ...extra
  };
}

function pushMasterConfig(embed, extra = {}) {
  postToEmbed(
    embed,
    "SKANDI_MASTER_CONFIG",
    masterPayload(extra)
  );
}

function pushSettingsState(embed) {
  if (!embed) return;

  const state = customerSettingsState();

  postToEmbed(
    embed,
    "CUSTOMER_SETTINGS_STATE",
    state
  );

  // Legacy alias for older SKANDI embeds.
  postToEmbed(
    embed,
    "SKANDI_SETTINGS_STATE",
    state
  );
}

function broadcastSettingsState() {
  const state = customerSettingsState();

  allHtmlComponents()
    .filter(Boolean)
    .forEach(embed => {
      postToEmbed(embed, "CUSTOMER_SETTINGS_STATE", state);
      postToEmbed(embed, "SKANDI_SETTINGS_STATE", state);
      pushMasterConfig(embed, { settings: state });
    });

  return state;
}

function closeCustomerHeaderPanels() {
  postToEmbed(
    customerHeaderEl(),
    "CLOSE_CUSTOMER_HEADER_PANELS",
    {}
  );
}

function navigate(path) {
  const value = String(path || "").trim();

  if (!isSafeRoute(value)) {
    console.warn("[MasterPage] Blocked unsafe navigation path:", value);
    return;
  }

  closeCustomerHeaderPanels();
  wixLocationFrontend.to(value);
}

async function getCustomerState() {
  try {
    const member = await currentMember.getMember();

    if (!member) {
      return {
        loggedIn: false,
        displayName: "",
        points: 0,
        tierName: "",
        menu: []
      };
    }

    const session = await getCustomerHeaderSession();

    return {
      loggedIn: true,
      displayName:
        session?.displayName ||
        member?.profile?.nickname ||
        member?.loginEmail ||
        "",
      points: Number(
        session?.points ||
        session?.clubPoints ||
        0
      ),
      tierName:
        session?.tierName ||
        session?.tier ||
        "",
      menu:
        Array.isArray(session?.menu)
          ? session.menu
          : []
    };
  } catch (error) {
    console.warn("[MasterPage] Customer session unavailable.", error);

    return {
      loggedIn: false,
      displayName: "",
      points: 0,
      tierName: "",
      menu: []
    };
  }
}

async function pushCustomerHeaderState(
  embed = customerHeaderEl()
) {
  if (!embed) return;

  postToEmbed(
    embed,
    "CUSTOMER_HEADER_STATE",
    await getCustomerState()
  );

  pushSettingsState(embed);
}

async function getStaffState() {
  try {
    const result = await getStaffPortalSession();

    if (
      !result ||
      result.ok === false ||
      result.authorized === false
    ) {
      return {
        authorized: false,
        profile: {}
      };
    }

    return {
      authorized: true,
      profile: result.profile || {},
      permissions: result.permissions || [],
      apps: result.apps || []
    };
  } catch (error) {
    console.warn("[MasterPage] Staff session unavailable.", error);

    return {
      authorized: false,
      profile: {}
    };
  }
}

async function pushStaffHeaderState(
  embed = safeEl(RIAINTRA_HEADER_EMBED)
) {
  if (!embed) return;

  const staff = await getStaffState();

  pushMasterConfig(embed, { staff });

  postToEmbed(
    embed,
    "RIAINTRA_HEADER_STATE",
    {
      ...staff,
      navigation: MASTER_CONFIG.internal.header,
      assets: MASTER_CONFIG.brand.assets
    }
  );
}

function runningInsideSettingsPopup() {
  try {
    const context = wixWindowFrontend.lightbox.getContext();

    return Boolean(
      context &&
      typeof context === "object" &&
      context.source === "SKANDI_MASTERPAGE"
    );
  } catch (_) {
    return false;
  }
}

async function ensureCustomerSettings() {
  if (
    isInternalPath() ||
    runningInsideSettingsPopup()
  ) {
    return null;
  }

  const stored = readStoredSettings();

  if (stored) {
    currentCustomerSettings = stored;
    broadcastSettingsState();
    return stored;
  }

  if (settingsPopupPromise) {
    return settingsPopupPromise;
  }

  settingsPopupPromise = (async () => {
    try {
      const result =
        await wixWindowFrontend.openLightbox(
          SETTINGS_POPUP_NAME,
          {
            source: "SKANDI_MASTERPAGE",
            settings: customerSettingsState()
          }
        );

      if (
        !result ||
        result.ok !== true
      ) {
        return null;
      }

      const saved = writeStoredSettings(result);

      broadcastSettingsState();

      return saved;
    } catch (error) {
      console.error(
        "[MasterPage] Language/currency popup failed.",
        error
      );
      return null;
    } finally {
      settingsPopupPromise = null;
    }
  })();

  return settingsPopupPromise;
}

async function handleMasterMessage(
  embed,
  message = {}
) {
  const type = String(message?.type || "");
  const source = String(message?.source || "");

  const payload =
    message?.payload &&
    typeof message.payload === "object"
      ? message.payload
      : {};

  if (
    type === "MASTER_CONFIG_REQUEST" ||
    type === "SKANDI_MASTER_CONFIG_REQUEST"
  ) {
    const extra =
      isInternalPath()
        ? { staff: await getStaffState() }
        : {
            customerSession: await getCustomerState(),
            settings: customerSettingsState()
          };

    pushMasterConfig(embed, extra);

    if (!isInternalPath()) {
      pushSettingsState(embed);
    }

    if (
      source === ALTEA_HEADER_SOURCE &&
      isAlteaPath()
    ) {
      const page = currentWixPageInfo();
      const staff = extra.staff || {};

      postToEmbed(
        embed,
        "ALTEA_HEADER_CONTEXT",
        {
          systemName:
            alteaRuntimeContext.systemName ||
            page.name ||
            "ALTEA",
          systemContext:
            alteaRuntimeContext.systemContext ||
            page.name ||
            "",
          pageName: page.name || "",
          pageUrl: page.url || "",
          station:
            alteaRuntimeContext.station ||
            staff?.profile?.station ||
            staff?.profile?.stationCode ||
            "USNYC",
          timeZone:
            alteaRuntimeContext.timeZone ||
            staff?.profile?.timeZone ||
            ""
        }
      );
    }

    return true;
  }

  if (type === "MASTER_ASSETS_REQUEST") {
    postToEmbed(
      embed,
      "SKANDI_MASTER_ASSETS",
      MASTER_CONFIG.brand.assets
    );
    return true;
  }

  if (type === "MASTER_NAVIGATION_REQUEST") {
    postToEmbed(
      embed,
      "SKANDI_MASTER_NAVIGATION",
      {
        customer: MASTER_CONFIG.customer,
        internal: MASTER_CONFIG.internal,
        routes: MASTER_CONFIG.routes,
        currentPath: currentPathString()
      }
    );
    return true;
  }

  if (
    !isInternalPath() &&
    (
      type === "UPDATE_SETTINGS" ||
      type === "CUSTOMER_SETTINGS_UPDATE"
    )
  ) {
    try {
      const saved =
        writeStoredSettings(
          payload?.settings || payload
        );

      const state =
        broadcastSettingsState();

      postToEmbed(
        embed,
        "CUSTOMER_SETTINGS_SAVED",
        {
          ok: true,
          ...saved,
          state
        }
      );
    } catch (_) {
      postToEmbed(
        embed,
        "CUSTOMER_SETTINGS_SAVED",
        {
          ok: false,
          message: "Invalid language or currency."
        }
      );
    }

    return true;
  }

  if (
    type === "CUSTOMER_SETTINGS_REQUEST" ||
    type === "SKANDI_SETTINGS_REQUEST"
  ) {
    pushSettingsState(embed);
    return true;
  }

  if (
    type === "ALTEA_SYSTEM_CONTEXT" &&
    isInternalPath()
  ) {
    const clean = {
      systemName:
        String(payload.systemName || "")
          .trim()
          .slice(0, 80),
      systemContext:
        String(payload.systemContext || "")
          .trim()
          .slice(0, 120),
      station:
        String(payload.station || "")
          .trim()
          .toUpperCase()
          .slice(0, 12),
      timeZone:
        String(payload.timeZone || "")
          .trim()
          .slice(0, 80)
    };

    alteaRuntimeContext = {
      ...alteaRuntimeContext,
      ...Object.fromEntries(
        Object.entries(clean)
          .filter(([, value]) => Boolean(value))
      )
    };

    const alteaHeader =
      safeEl(ALTEA_HEADER_EMBED);

    if (alteaHeader) {
      postToEmbed(
        alteaHeader,
        "ALTEA_HEADER_CONTEXT",
        alteaRuntimeContext
      );
    }

    return true;
  }

  if (type === "MASTER_NAVIGATE") {
    navigate(
      message.path ||
      payload.path ||
      ""
    );
    return true;
  }

  if (
    source === CUSTOMER_HEADER_SOURCE &&
    type === "SKANDI_EMBED_RESIZE"
  ) {
    const requested =
      Number(payload.height);

    const height =
      Number.isFinite(requested)
        ? Math.max(
            118,
            Math.min(
              1200,
              Math.round(requested)
            )
          )
        : 118;

    try {
      if ("height" in embed) {
        embed.height = height;
      }
    } catch (error) {
      console.warn(
        "[MasterPage] Header resize failed.",
        error
      );
    }

    return true;
  }

  if (source === CUSTOMER_HEADER_SOURCE) {
    switch (type) {
      case "HEADER_READY":
        pushMasterConfig(
          embed,
          {
            customerSession:
              await getCustomerState(),
            settings:
              customerSettingsState()
          }
        );

        pushSettingsState(embed);

        await pushCustomerHeaderState(embed);

        return true;

      case "HEADER_NAVIGATE":
        navigate(
          message.path ||
          payload.path
        );
        return true;

      case "HEADER_SEARCH":
        navigate(
          MASTER_CONFIG.routes.search
        );
        return true;

      case "HEADER_LOGIN":
        closeCustomerHeaderPanels();

        try {
          await authentication.promptLogin();
        } catch (_) {}

        await pushCustomerHeaderState(embed);
        return true;

      case "HEADER_LOGIN_SUBMIT":
        try {
          await authentication.login(
            message.email || payload.email,
            message.password || payload.password
          );

          await pushCustomerHeaderState(embed);
        } catch (_) {
          postToEmbed(
            embed,
            "HOME_ERROR",
            {
              message:
                "Invalid email or password. Please try again."
            }
          );
        }
        return true;

      case "HEADER_FORGOT_PASSWORD":
        closeCustomerHeaderPanels();

        try {
          await authentication.promptForgotPassword();
        } catch (_) {}

        return true;

      case "HEADER_LOGOUT":
        closeCustomerHeaderPanels();

        try {
          await authentication.logout();
        } catch (_) {}

        wixLocationFrontend.to(
          MASTER_CONFIG.routes.home
        );

        return true;

      default:
        break;
    }
  }

  if (source === CUSTOMER_FOOTER_SOURCE) {
    switch (type) {
      case "FOOTER_READY":
        pushMasterConfig(
          embed,
          {
            settings:
              customerSettingsState()
          }
        );

        pushSettingsState(embed);

        postToEmbed(
          embed,
          "CUSTOMER_FOOTER_STATE",
          {
            ready: true,
            navigation:
              MASTER_CONFIG.customer.footer,
            assets:
              MASTER_CONFIG.brand.assets,
            settings:
              customerSettingsState()
          }
        );
        return true;

      case "FOOTER_NAVIGATE":
        navigate(
          message.path ||
          payload.path
        );
        return true;

      case "FOOTER_STAFF_LOGIN":
        navigate(
          MASTER_CONFIG.routes.riaintra
        );
        return true;

      case "FOOTER_NEWSLETTER_SIGNUP": {
        const email =
          String(
            message.email ||
            payload.email ||
            ""
          ).trim();

        if (!email) {
          postToEmbed(
            embed,
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

          postToEmbed(
            embed,
            "FOOTER_NEWSLETTER_RESULT",
            result
          );
        } catch (error) {
          postToEmbed(
            embed,
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
        break;
    }
  }

  if (
    type === "RIAINTRA_HEADER_READY" ||
    type === "INTERNAL_HEADER_READY"
  ) {
    await pushStaffHeaderState(embed);
    return true;
  }

  if (
    type === "RIAINTRA_NAVIGATE" ||
    type === "INTERNAL_MASTER_NAVIGATE"
  ) {
    navigate(
      message.path ||
      payload.path
    );
    return true;
  }

  if (
    type === "RIAINTRA_LOGOUT" ||
    type === "INTERNAL_MASTER_LOGOUT"
  ) {
    try {
      await authentication.logout();
    } catch (_) {}

    wixLocationFrontend.to(
      MASTER_CONFIG.routes.home
    );

    return true;
  }

  return false;
}

const wiredEmbedIds = new Set();

function wireHtmlComponent(embed) {
  if (
    !embed ||
    typeof embed.onMessage !== "function"
  ) {
    return;
  }

  const key =
    embed.id ||
    String(embed);

  if (wiredEmbedIds.has(key)) {
    return;
  }

  wiredEmbedIds.add(key);

  embed.onMessage(
    async event => {
      try {
        await handleMasterMessage(
          embed,
          event?.data || {}
        );
      } catch (error) {
        console.error(
          `[MasterPage] Message handling failed for ${embed.id}.`,
          error
        );
      }
    }
  );

  pushMasterConfig(
    embed,
    isInternalPath()
      ? {}
      : { settings: customerSettingsState() }
  );

  if (!isInternalPath()) {
    pushSettingsState(embed);
  }
}

function wireAllHtmlComponents() {
  const globalIds =
    new Set([
      CUSTOMER_HEADER_EMBED,
      CUSTOMER_HEADER_EMBED_LEGACY,
      CUSTOMER_FOOTER_EMBED,
      CUSTOMER_FOOTER_EMBED_LEGACY,
      RIAINTRA_HEADER_EMBED,
      RIAINTRA_FOOTER_EMBED,
      ALTEA_HEADER_EMBED
    ].map(
      value =>
        value.replace(/^#/, "")
    ));

  const components =
    allHtmlComponents();

  if (isChromeFreeInternalPath()) {
    components
      .filter(
        embed => {
          const id =
            String(embed?.id || "")
              .replace(/^#/, "");

          return !globalIds.has(id);
        }
      )
      .forEach(
        wireHtmlComponent
      );

    return;
  }

  [
    customerHeaderEl(),
    customerFooterEl(),
    safeEl(RIAINTRA_HEADER_EMBED),
    safeEl(RIAINTRA_FOOTER_EMBED),
    safeEl(ALTEA_HEADER_EMBED),
    ...components
  ]
    .filter(Boolean)
    .forEach(
      wireHtmlComponent
    );
}

async function showChromeElement(element) {
  if (!element) return;

  try {
    if (typeof element.expand === "function") {
      await element.expand();
    }
  } catch (_) {}

  try {
    if (typeof element.show === "function") {
      await element.show();
    }
  } catch (_) {}
}

async function hideChromeElement(element) {
  if (!element) return;

  try {
    if (typeof element.hide === "function") {
      await element.hide();
    }
  } catch (_) {}

  try {
    if (typeof element.collapse === "function") {
      await element.collapse();
    }
  } catch (_) {}
}

async function applyChromeVisibility() {
  const internal =
    isInternalPath();

  const altea =
    isAlteaPath();

  const customerHeader =
    customerHeaderEl();

  const customerFooter =
    customerFooterEl();

  const riaHeader =
    safeEl(RIAINTRA_HEADER_EMBED);

  const riaFooter =
    safeEl(RIAINTRA_FOOTER_EMBED);

  const alteaHeader =
    safeEl(ALTEA_HEADER_EMBED);

  if (isChromeFreeInternalPath()) {
    await hideChromeElement(customerHeader);
    await hideChromeElement(customerFooter);
    await hideChromeElement(riaHeader);
    await hideChromeElement(riaFooter);
    await hideChromeElement(alteaHeader);
    return;
  }

  if (internal) {
    await hideChromeElement(customerHeader);
    await hideChromeElement(customerFooter);
    await showChromeElement(riaHeader);
    await showChromeElement(riaFooter);

    if (altea) {
      await showChromeElement(alteaHeader);

      const staff =
        await getStaffState();

      const page =
        currentWixPageInfo();

      pushMasterConfig(
        alteaHeader,
        { staff }
      );

      postToEmbed(
        alteaHeader,
        "ALTEA_HEADER_CONTEXT",
        {
          systemName:
            page.name ||
            "ALTEA",
          pageName:
            page.name ||
            "",
          pageUrl:
            page.url ||
            "",
          station:
            alteaRuntimeContext.station ||
            staff?.profile?.station ||
            staff?.profile?.stationCode ||
            "USNYC",
          timeZone:
            alteaRuntimeContext.timeZone ||
            staff?.profile?.timeZone ||
            ""
        }
      );
    } else {
      await hideChromeElement(
        alteaHeader
      );
    }

    await pushStaffHeaderState(
      riaHeader
    );
  } else {
    await showChromeElement(
      customerHeader
    );

    await showChromeElement(
      customerFooter
    );

    await hideChromeElement(
      riaHeader
    );

    await hideChromeElement(
      riaFooter
    );

    await hideChromeElement(
      alteaHeader
    );

    await pushCustomerHeaderState(
      customerHeader
    );

    if (customerFooter) {
      pushMasterConfig(
        customerFooter,
        {
          settings:
            customerSettingsState()
        }
      );

      pushSettingsState(
        customerFooter
      );
    }
  }
}

$w.onReady(async function () {
  const page =
    currentWixPageInfo();

  console.log(
    "[MasterPage] Current Wix page:",
    {
      name: page.name,
      url: page.url,
      type: page.type,
      isAltea: isAlteaPath()
    }
  );

  wireAllHtmlComponents();

  await applyChromeVisibility();

  if (!isInternalPath()) {
    const stored =
      readStoredSettings();

    if (stored) {
      currentCustomerSettings =
        stored;

      broadcastSettingsState();
    } else {
      await ensureCustomerSettings();
    }
  }

  authentication.onLogin(
    async () => {
      if (isChromeFreeInternalPath()) {
        return;
      }

      if (isInternalPath()) {
        await pushStaffHeaderState();
      } else {
        await pushCustomerHeaderState();
        broadcastSettingsState();
      }
    }
  );

  setTimeout(
    () => {
      if (isChromeFreeInternalPath()) {
        return;
      }

      allHtmlComponents()
        .forEach(
          embed => {
            pushMasterConfig(
              embed,
              isInternalPath()
                ? {}
                : {
                    settings:
                      customerSettingsState()
                  }
            );

            if (!isInternalPath()) {
              pushSettingsState(embed);
            }
          }
        );
    },
    500
  );
});
