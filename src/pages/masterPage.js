// masterPage.js
//
// SKANDI GLOBAL MASTER PAGE
// Version: 2026.08.25.2
//
// Controls:
// - Public SKANDI customer header
// - Public SKANDI customer footer
// - RIAINTRA internal header
// - RIAINTRA internal footer
// - ALTEA stacked header
// - Customer language / currency
// - Customer member session
// - Staff session
// - Global navigation
//
// IMPORTANT:
// Public/internal page HTML embeds must NOT include their own global
// headers or footers.
//
// IMPORTANT:
// #riaintraHeaderEmbed, #riaintraFooterEmbed,
// #skandiCustomerHeaderEmbed, #skandiCustomerFooterEmbed and
// #altea-header must be actual Wix HTML Components if they need
// postMessage communication.
//
// This version will NOT crash the Master Page if one of those IDs
// accidentally points to a Section, Box or other Wix element.


import wixLocationFrontend from "wix-location-frontend";

import wixSiteFrontend from "wix-site-frontend";

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


/* ==========================================================================
   VERSION
   ========================================================================== */

const MASTER_VERSION =
  "2026.08.25.2";


/* ==========================================================================
   GLOBAL ELEMENT IDS
   ========================================================================== */

const CUSTOMER_HEADER_EMBED =
  "#skandiCustomerHeaderEmbed";

const CUSTOMER_FOOTER_EMBED =
  "#skandiCustomerFooterEmbed";

const RIAINTRA_HEADER_EMBED =
  "#riaintraHeaderEmbed";

const RIAINTRA_FOOTER_EMBED =
  "#riaintraFooterEmbed";

const ALTEA_HEADER_EMBED =
  "#altea-header";


/* ==========================================================================
   MESSAGE SOURCES
   ========================================================================== */

const PARENT_SOURCE =
  "SKANDI_WIX_PARENT";

const CUSTOMER_HEADER_SOURCE =
  "SKANDI_CUSTOMER_HEADER_EXPANDBAR";

const CUSTOMER_FOOTER_SOURCE =
  "SKANDI_CUSTOMER_FOOTER";

const RIAINTRA_HEADER_SOURCE =
  "SKANDI_RIAINTRA_HEADER";

const RIAINTRA_FOOTER_SOURCE =
  "SKANDI_RIAINTRA_FOOTER";

const INTERNAL_CHROME_SOURCE =
  "SKANDI_INTERNAL_CHROME";

const ALTEA_HEADER_SOURCE =
  "SKANDI_ALTEA_HEADER";


/* ==========================================================================
   BRAND ASSETS
   ========================================================================== */

const ASSETS =
  Object.freeze({

    customerHeader:
      "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",

    skandiPrimary:
      "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",

    skandiWhite:
      "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",

    skandiTravels:
      "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",

    riaintra:
      "https://static.wixstatic.com/media/394052_1024542c47664bff8f4e145d1adf472d~mv2.png",

    altea:
      "https://static.wixstatic.com/media/394052_46045c41aebf421d98314b31ef83c677~mv2.png",

    voy:
      "https://static.wixstatic.com/media/394052_30b8bebbf5ee493da7d47329d04de494~mv2.png",

    voyWhite:
      "https://static.wixstatic.com/media/394052_3770b6753c474d73a77c674b20eab305~mv2.png"
  });


/* ==========================================================================
   ROUTES
   ========================================================================== */

const ROUTES =
  Object.freeze({

    home:
      "/home",

    search:
      "/home?focus=search",

    flights:
      "/flights",

    hotels:
      "/hotels",

    packages:
      "/packages",

    tours:
      "/tours",

    activities:
      "/activities",

    transfers:
      "/transfers",

    destinations:
      "/destinations",

    signatureCollection:
      "/skandi-collection",

    voy:
      "/voy-magazine",

    newsroom:
      "/about/news-room",

    myTrip:
      "/my-trip",

    club:
      "/skandi-club",

    support:
      "/about/support",

    contact:
      "/about/contact",

    about:
      "/about",

    legal:
      "/about/legal",

    staffLogin:
      "/riaintra",

    staffPortal:
      "/riaintra/staff-portal",

    successFactors:
      "/riaintra/success-factors",

    altea:
      "/riaintra/success-factors/altea",

    mail:
      "/riaintra/mail",

    docunet:
      "/riaintra/docunet",

    serviceDesk:
      "/riaintra/service-desk",

    magazineManager:
      "/riaintra/media-control"
  });


/* ==========================================================================
   PUBLIC NAVIGATION
   ========================================================================== */

const PUBLIC_PRIMARY_NAV =
  Object.freeze([
    {
      label:
        "Flights",

      path:
        ROUTES.flights
    },

    {
      label:
        "Hotels",

      path:
        ROUTES.hotels
    },

    {
      label:
        "Packages",

      path:
        ROUTES.packages
    },

    {
      label:
        "Tours & Activities",

      path:
        ROUTES.tours
    },

    {
      label:
        "Transfers",

      path:
        ROUTES.transfers
    }
  ]);


const PUBLIC_SECONDARY_NAV =
  Object.freeze([
    {
      label:
        "Destinations",

      path:
        ROUTES.destinations
    },

    {
      label:
        "SKANDI Collection",

      path:
        ROUTES.signatureCollection
    },

    {
      label:
        "VOY Magazine",

      path:
        ROUTES.voy
    },

    {
      label:
        "Newsroom",

      path:
        ROUTES.newsroom
    }
  ]);


const PUBLIC_ACCOUNT_NAV =
  Object.freeze([
    {
      label:
        "My Trip",

      path:
        ROUTES.myTrip
    },

    {
      label:
        "SKANDI Club",

      path:
        ROUTES.club
    },

    {
      label:
        "Support",

      path:
        ROUTES.support
    }
  ]);


/* ==========================================================================
   INTERNAL NAVIGATION
   ========================================================================== */

const INTERNAL_APPS =
  Object.freeze([
    {
      id:
        "staff-portal",

      title:
        "RIAINTRA",

      path:
        ROUTES.staffPortal
    },

    {
      id:
        "success-factors",

      title:
        "SuccessFactors",

      path:
        ROUTES.successFactors
    },

    {
      id:
        "altea",

      title:
        "ALTEA",

      path:
        ROUTES.altea
    },

    {
      id:
        "mail",

      title:
        "Mail",

      path:
        ROUTES.mail
    },

    {
      id:
        "docunet",

      title:
        "DocuNet",

      path:
        ROUTES.docunet
    },

    {
      id:
        "service-desk",

      title:
        "Service Desk",

      path:
        ROUTES.serviceDesk
    }
  ]);


/* ==========================================================================
   LANGUAGE / CURRENCY
   ========================================================================== */

const LANGUAGES =
  Object.freeze([
    {
      code:
        "EN",

      label:
        "English"
    },

    {
      code:
        "SV",

      label:
        "Svenska"
    },

    {
      code:
        "NO",

      label:
        "Norsk"
    },

    {
      code:
        "DA",

      label:
        "Dansk"
    },

    {
      code:
        "ES",

      label:
        "Español"
    },

    {
      code:
        "FI",

      label:
        "Suomi"
    },

    {
      code:
        "FR-FR",

      label:
        "Français"
    },

    {
      code:
        "FR-CA",

      label:
        "Français (Canada)"
    },

    {
      code:
        "DE",

      label:
        "Deutsch"
    },

    {
      code:
        "TH",

      label:
        "ไทย"
    }
  ]);


const CURRENCIES =
  Object.freeze([
    "USD",
    "SEK",
    "NOK",
    "DKK",
    "EUR"
  ]);


const DEFAULT_SETTINGS =
  Object.freeze({
    language:
      "EN",

    currency:
      "USD"
  });


/* ==========================================================================
   SLOGANS
   ========================================================================== */

const SLOGANS =
  Object.freeze({

    EN:
      "Unforgettable Moments",

    SV:
      "När du längtar bort",

    NO:
      "Når du lengter bort",

    DA:
      "Når du længes væk",

    FI:
      "Kun kaipaat pois"
  });


/* ==========================================================================
   STATE
   ========================================================================== */

let customerSession =
  null;

let staffSession =
  null;

let currentSettings = {
  ...DEFAULT_SETTINGS
};

let initialized =
  false;


/* ==========================================================================
   ELEMENT HELPERS
   ========================================================================== */

function getElement(
  selector
) {
  try {
    return $w(
      selector
    );
  } catch (_) {
    return null;
  }
}


function isHtmlComponent(
  element
) {
  return Boolean(
    element &&
    typeof element.postMessage ===
      "function"
  );
}


function safePostToEmbed(
  selector,
  type,
  payload = {}
) {
  const embed =
    getElement(
      selector
    );

  if (!embed) {
    console.warn(
      `[MasterPage] ${selector} does not exist.`
    );

    return false;
  }

  if (
    typeof embed.postMessage !==
    "function"
  ) {
    console.warn(
      `[MasterPage] ${selector} is not an HTML Component.`,
      {
        selector,

        wixType:
          embed.type ||
          "unknown",

        eventType:
          type
      }
    );

    return false;
  }

  try {
    embed.postMessage({
      source:
        PARENT_SOURCE,

      type,

      payload,

      timestamp:
        new Date()
          .toISOString(),

      masterVersion:
        MASTER_VERSION
    });

    return true;
  } catch (error) {
    console.error(
      `[MasterPage] postMessage failed for ${selector}.`,
      error
    );

    return false;
  }
}


function safeBindMessages(
  selector,
  handler
) {
  const embed =
    getElement(
      selector
    );

  if (!embed) {
    return false;
  }

  if (
    typeof embed.onMessage !==
    "function"
  ) {
    console.warn(
      `[MasterPage] ${selector} cannot receive HTML Component messages.`,
      {
        wixType:
          embed.type ||
          "unknown"
      }
    );

    return false;
  }

  try {
    embed.onMessage(
      handler
    );

    return true;
  } catch (error) {
    console.error(
      `[MasterPage] Failed binding onMessage for ${selector}.`,
      error
    );

    return false;
  }
}


async function safeShow(
  selector
) {
  const element =
    getElement(
      selector
    );

  if (!element) {
    return;
  }

  try {
    if (
      typeof element.show ===
      "function"
    ) {
      await element.show();
    }
  } catch (error) {
    console.warn(
      `[MasterPage] Could not show ${selector}.`,
      error
    );
  }
}


async function safeHide(
  selector
) {
  const element =
    getElement(
      selector
    );

  if (!element) {
    return;
  }

  try {
    if (
      typeof element.hide ===
      "function"
    ) {
      await element.hide();
    }
  } catch (error) {
    console.warn(
      `[MasterPage] Could not hide ${selector}.`,
      error
    );
  }
}


/* ==========================================================================
   PATH HELPERS
   ========================================================================== */

function currentPath() {
  const parts =
    Array.isArray(
      wixLocationFrontend.path
    )
      ? wixLocationFrontend.path
      : [];

  const path =
    "/" +
    parts.join(
      "/"
    );

  return path ===
    "/"
    ? "/"
    : path.replace(
        /\/+$/,
        ""
      );
}


function isInternalPath(
  path = currentPath()
) {
  return (
    path ===
      "/riaintra" ||
    path.startsWith(
      "/riaintra/"
    ) ||
    path ===
      "/altea" ||
    path.startsWith(
      "/altea/"
    )
  );
}


function isAlteaPath(
  path = currentPath()
) {
  const normalized =
    path.toLowerCase();

  return (
    normalized.includes(
      "/altea"
    ) ||
    normalized.includes(
      "success-factors/altea"
    )
  );
}


function isStaffLoginPage(
  path = currentPath()
) {
  return (
    path ===
    ROUTES.staffLogin
  );
}


function pageNameForPath(
  path
) {
  const map = {
    [ROUTES.staffLogin]:
      "RIAINTRA",

    [ROUTES.staffPortal]:
      "RIAINTRA Dashboard",

    [ROUTES.successFactors]:
      "SuccessFactors",

    [ROUTES.altea]:
      "ALTEA",

    [ROUTES.mail]:
      "Mail",

    [ROUTES.docunet]:
      "DocuNet",

    [ROUTES.serviceDesk]:
      "Service Desk",

    [ROUTES.home]:
      "Home",

    [ROUTES.flights]:
      "Flights",

    [ROUTES.hotels]:
      "Hotels",

    [ROUTES.packages]:
      "Packages",

    [ROUTES.tours]:
      "Tours & Activities",

    [ROUTES.transfers]:
      "Transfers",

    [ROUTES.club]:
      "SKANDI Club",

    [ROUTES.voy]:
      "VOY Magazine"
  };

  return (
    map[path] ||
    (
      isInternalPath(
        path
      )
        ? "RIAINTRA"
        : "SKANDI Travels"
    )
  );
}


/* ==========================================================================
   NAVIGATION
   ========================================================================== */

function normalizePath(
  value
) {
  const path =
    String(
      value ||
      ""
    ).trim();

  if (!path) {
    return "";
  }

  if (
    path.startsWith(
      "http://"
    ) ||
    path.startsWith(
      "https://"
    )
  ) {
    return path;
  }

  return path.startsWith(
    "/"
  )
    ? path
    : `/${path}`;
}


function navigate(
  destination
) {
  const path =
    normalizePath(
      destination
    );

  if (!path) {
    return;
  }

  try {
    wixLocationFrontend.to(
      path
    );
  } catch (error) {
    console.error(
      "[MasterPage] Navigation failed.",
      {
        destination:
          path,
        error
      }
    );
  }
}


/* ==========================================================================
   SETTINGS
   ========================================================================== */

function validLanguage(
  code
) {
  const normalized =
    String(
      code ||
      ""
    )
      .trim()
      .toUpperCase();

  return LANGUAGES.some(
    (language) =>
      language.code ===
      normalized
  )
    ? normalized
    : DEFAULT_SETTINGS.language;
}


function validCurrency(
  code
) {
  const normalized =
    String(
      code ||
      ""
    )
      .trim()
      .toUpperCase();

  return CURRENCIES.includes(
    normalized
  )
    ? normalized
    : DEFAULT_SETTINGS.currency;
}


function updateSettings({
  language,
  currency
} = {}) {
  currentSettings = {
    language:
      language !==
      undefined
        ? validLanguage(
            language
          )
        : currentSettings.language,

    currency:
      currency !==
      undefined
        ? validCurrency(
            currency
          )
        : currentSettings.currency
  };

  broadcastPublicSettings();

  return currentSettings;
}


function broadcastPublicSettings() {
  const payload = {
    settings:
      currentSettings,

    language:
      currentSettings.language,

    currency:
      currentSettings.currency,

    slogan:
      SLOGANS[
        currentSettings.language
      ] ||
      SLOGANS.EN,

    languages:
      LANGUAGES,

    currencies:
      CURRENCIES
  };

  safePostToEmbed(
    CUSTOMER_HEADER_EMBED,
    "CUSTOMER_SETTINGS_UPDATED",
    payload
  );

  safePostToEmbed(
    CUSTOMER_FOOTER_EMBED,
    "CUSTOMER_SETTINGS_UPDATED",
    payload
  );
}


/* ==========================================================================
   CUSTOMER SESSION
   ========================================================================== */

async function loadCustomerSession() {
  try {
    const result =
      await getCustomerHeaderSession();

    customerSession =
      result ||
      null;

    return customerSession;
  } catch (error) {
    console.warn(
      "[MasterPage] Customer session unavailable.",
      error
    );

    customerSession =
      null;

    return null;
  }
}


async function refreshCustomerSession() {
  await loadCustomerSession();

  sendCustomerChrome();
}


/* ==========================================================================
   STAFF SESSION
   ========================================================================== */

async function loadStaffSession() {
  try {
    const result =
      await getStaffPortalSession();

    staffSession =
      result ||
      null;

    return staffSession;
  } catch (error) {
    console.warn(
      "[MasterPage] Staff session unavailable.",
      error
    );

    staffSession =
      null;

    return null;
  }
}


/* ==========================================================================
   CUSTOMER CHROME PAYLOAD
   ========================================================================== */

function customerChromePayload() {
  return {
    masterVersion:
      MASTER_VERSION,

    path:
      currentPath(),

    assets:
      ASSETS,

    routes:
      ROUTES,

    primaryNav:
      PUBLIC_PRIMARY_NAV,

    secondaryNav:
      PUBLIC_SECONDARY_NAV,

    accountNav:
      PUBLIC_ACCOUNT_NAV,

    languages:
      LANGUAGES,

    currencies:
      CURRENCIES,

    settings:
      currentSettings,

    language:
      currentSettings.language,

    currency:
      currentSettings.currency,

    slogan:
      SLOGANS[
        currentSettings.language
      ] ||
      SLOGANS.EN,

    session:
      customerSession,

    member:
      customerSession?.member ||
      customerSession?.profile ||
      null,

    loggedIn:
      Boolean(
        customerSession?.loggedIn ||
        customerSession?.authenticated
      )
  };
}


function sendCustomerChrome() {
  const payload =
    customerChromePayload();

  safePostToEmbed(
    CUSTOMER_HEADER_EMBED,
    "CUSTOMER_HEADER_BOOTSTRAP",
    payload
  );

  safePostToEmbed(
    CUSTOMER_FOOTER_EMBED,
    "CUSTOMER_FOOTER_BOOTSTRAP",
    payload
  );
}


/* ==========================================================================
   INTERNAL CHROME PAYLOAD
   ========================================================================== */

function staffProfile() {
  return (
    staffSession?.profile ||
    staffSession?.staff ||
    staffSession?.agent ||
    {}
  );
}


function staffApps() {
  return (
    Array.isArray(
      staffSession?.apps
    )
      ? staffSession.apps
      : INTERNAL_APPS
  );
}


function internalChromePayload() {
  const path =
    currentPath();

  return {
    masterVersion:
      MASTER_VERSION,

    pageName:
      pageNameForPath(
        path
      ),

    pagePath:
      path,

    pageSubtitle:
      "SKANDI internal staff system",

    profile:
      staffProfile(),

    apps:
      staffApps(),

    permissions:
      staffSession?.permissions ||
      staffProfile()?.permissions ||
      {},

    session:
      staffSession,

    assets:
      ASSETS,

    routes:
      ROUTES,

    isAltea:
      isAlteaPath(
        path
      ),

    authorized:
      staffSession?.authorized ===
      true,

    loggedIn:
      Boolean(
        staffSession?.loggedIn ||
        staffSession?.authenticated
      )
  };
}


function sendInternalChrome() {
  const payload =
    internalChromePayload();

  safePostToEmbed(
    RIAINTRA_HEADER_EMBED,
    "INTERNAL_CHROME_BOOTSTRAP",
    payload
  );

  safePostToEmbed(
    RIAINTRA_FOOTER_EMBED,
    "INTERNAL_CHROME_BOOTSTRAP",
    payload
  );

  if (
    isAlteaPath()
  ) {
    safePostToEmbed(
      ALTEA_HEADER_EMBED,
      "ALTEA_HEADER_BOOTSTRAP",
      {
        ...payload,

        slogan:
          "WE MAKE DOOR TO DOOR STAY IN SYNC"
      }
    );
  }
}


/* ==========================================================================
   CHROME VISIBILITY
   ========================================================================== */

async function updateChromeVisibility() {
  const path =
    currentPath();

  const internal =
    isInternalPath(
      path
    );

  const staffLogin =
    isStaffLoginPage(
      path
    );

  const altea =
    isAlteaPath(
      path
    );

  if (internal) {

    await safeHide(
      CUSTOMER_HEADER_EMBED
    );

    await safeHide(
      CUSTOMER_FOOTER_EMBED
    );


    /*
     * Login page does not need the logged-in internal chrome.
     */
    if (staffLogin) {

      await safeHide(
        RIAINTRA_HEADER_EMBED
      );

      await safeHide(
        RIAINTRA_FOOTER_EMBED
      );

      await safeHide(
        ALTEA_HEADER_EMBED
      );

      return;
    }


    await safeShow(
      RIAINTRA_HEADER_EMBED
    );

    await safeShow(
      RIAINTRA_FOOTER_EMBED
    );


    if (altea) {

      await safeShow(
        ALTEA_HEADER_EMBED
      );

    } else {

      await safeHide(
        ALTEA_HEADER_EMBED
      );
    }

    return;
  }


  /*
   * Public customer site
   */

  await safeShow(
    CUSTOMER_HEADER_EMBED
  );

  await safeShow(
    CUSTOMER_FOOTER_EMBED
  );

  await safeHide(
    RIAINTRA_HEADER_EMBED
  );

  await safeHide(
    RIAINTRA_FOOTER_EMBED
  );

  await safeHide(
    ALTEA_HEADER_EMBED
  );
}


/* ==========================================================================
   CUSTOMER HEADER EVENTS
   ========================================================================== */

async function handleCustomerHeaderMessage(
  event
) {
  const message =
    event?.data ||
    {};

  if (
    message.source !==
    CUSTOMER_HEADER_SOURCE
  ) {
    return;
  }

  const payload =
    message.payload ||
    {};

  try {
    switch (
      message.type
    ) {

      case "CUSTOMER_HEADER_READY":
      case "CUSTOMER_HEADER_REFRESH":

        await refreshCustomerSession();

        return;


      case "CUSTOMER_NAVIGATE":

        navigate(
          payload.path ||
          payload.url
        );

        return;


      case "CUSTOMER_SEARCH":

        navigate(
          ROUTES.search
        );

        return;


      case "CUSTOMER_LANGUAGE_CHANGE":

        updateSettings({
          language:
            payload.language ||
            payload.code
        });

        return;


      case "CUSTOMER_CURRENCY_CHANGE":

        updateSettings({
          currency:
            payload.currency ||
            payload.code
        });

        return;


      case "CUSTOMER_SETTINGS_CHANGE":

        updateSettings({
          language:
            payload.language,

          currency:
            payload.currency
        });

        return;


      case "CUSTOMER_MEMBER_LOGIN":

        navigate(
          ROUTES.myTrip
        );

        return;


      case "CUSTOMER_MEMBER_LOGOUT":

        await authentication.logout();

        await refreshCustomerSession();

        return;


      case "CUSTOMER_CLUB_OPEN":

        navigate(
          ROUTES.club
        );

        return;


      default:

        return;
    }

  } catch (error) {
    console.error(
      `[MasterPage] Customer header event ${message.type} failed.`,
      error
    );

    safePostToEmbed(
      CUSTOMER_HEADER_EMBED,
      "CUSTOMER_HEADER_ERROR",
      {
        message:
          cleanError(
            error
          )
      }
    );
  }
}


/* ==========================================================================
   CUSTOMER FOOTER EVENTS
   ========================================================================== */

async function handleCustomerFooterMessage(
  event
) {
  const message =
    event?.data ||
    {};

  if (
    message.source !==
    CUSTOMER_FOOTER_SOURCE
  ) {
    return;
  }

  const payload =
    message.payload ||
    {};

  try {
    switch (
      message.type
    ) {

      case "CUSTOMER_FOOTER_READY":

        sendCustomerChrome();

        return;


      case "CUSTOMER_NAVIGATE":

        navigate(
          payload.path ||
          payload.url
        );

        return;


      case "CUSTOMER_LANGUAGE_CHANGE":

        updateSettings({
          language:
            payload.language ||
            payload.code
        });

        return;


      case "CUSTOMER_CURRENCY_CHANGE":

        updateSettings({
          currency:
            payload.currency ||
            payload.code
        });

        return;


      case "CUSTOMER_NEWSLETTER_SUBSCRIBE":

        await handleNewsletterSubscription(
          payload
        );

        return;


      default:

        return;
    }

  } catch (error) {
    console.error(
      `[MasterPage] Customer footer event ${message.type} failed.`,
      error
    );

    safePostToEmbed(
      CUSTOMER_FOOTER_EMBED,
      "CUSTOMER_FOOTER_ERROR",
      {
        message:
          cleanError(
            error
          )
      }
    );
  }
}


/* ==========================================================================
   NEWSLETTER
   ========================================================================== */

async function handleNewsletterSubscription(
  payload = {}
) {
  const email =
    String(
      payload.email ||
      ""
    )
      .trim()
      .toLowerCase();

  if (!email) {
    throw new Error(
      "Enter your email address."
    );
  }

  const result =
    await subscribeCustomerNewsletter({
      email,

      language:
        currentSettings.language,

      currency:
        currentSettings.currency
    });

  safePostToEmbed(
    CUSTOMER_FOOTER_EMBED,
    "CUSTOMER_NEWSLETTER_RESULT",
    {
      ok:
        result?.ok !==
        false,

      result
    }
  );
}


/* ==========================================================================
   RIAINTRA HEADER EVENTS
   ========================================================================== */

async function handleRiaintraHeaderMessage(
  event
) {
  const message =
    event?.data ||
    {};

  if (
    ![
      RIAINTRA_HEADER_SOURCE,
      INTERNAL_CHROME_SOURCE
    ].includes(
      message.source
    )
  ) {
    return;
  }

  const payload =
    message.payload ||
    {};

  try {
    switch (
      message.type
    ) {

      case "INTERNAL_CHROME_READY":
      case "RIAINTRA_HEADER_READY":

        if (
          !staffSession
        ) {
          await loadStaffSession();
        }

        sendInternalChrome();

        return;


      case "INTERNAL_NAVIGATE":
      case "RIAINTRA_NAVIGATE":

        openInternalPath(
          payload.path
        );

        return;


      case "INTERNAL_LOGOUT":
      case "RIAINTRA_LOGOUT":

        await signOutInternal();

        return;


      case "INTERNAL_REFRESH_SESSION":

        await loadStaffSession();

        sendInternalChrome();

        return;


      default:

        return;
    }

  } catch (error) {
    console.error(
      `[MasterPage] RIAINTRA header event ${message.type} failed.`,
      error
    );
  }
}


/* ==========================================================================
   RIAINTRA FOOTER EVENTS
   ========================================================================== */

async function handleRiaintraFooterMessage(
  event
) {
  const message =
    event?.data ||
    {};

  if (
    ![
      RIAINTRA_FOOTER_SOURCE,
      INTERNAL_CHROME_SOURCE
    ].includes(
      message.source
    )
  ) {
    return;
  }

  const payload =
    message.payload ||
    {};

  try {
    switch (
      message.type
    ) {

      case "INTERNAL_CHROME_READY":
      case "RIAINTRA_FOOTER_READY":

        sendInternalChrome();

        return;


      case "INTERNAL_NAVIGATE":

        openInternalPath(
          payload.path
        );

        return;


      case "INTERNAL_LOGOUT":

        await signOutInternal();

        return;


      default:

        return;
    }

  } catch (error) {
    console.error(
      `[MasterPage] RIAINTRA footer event ${message.type} failed.`,
      error
    );
  }
}


/* ==========================================================================
   ALTEA HEADER EVENTS
   ========================================================================== */

async function handleAlteaHeaderMessage(
  event
) {
  const message =
    event?.data ||
    {};

  if (
    message.source !==
      ALTEA_HEADER_SOURCE &&
    message.source !==
      INTERNAL_CHROME_SOURCE
  ) {
    return;
  }

  const payload =
    message.payload ||
    {};

  try {
    switch (
      message.type
    ) {

      case "ALTEA_HEADER_READY":
      case "INTERNAL_CHROME_READY":

        sendInternalChrome();

        return;


      case "ALTEA_NAVIGATE":
      case "INTERNAL_NAVIGATE":

        openInternalPath(
          payload.path
        );

        return;


      case "ALTEA_LOGOUT":
      case "INTERNAL_LOGOUT":

        await signOutInternal();

        return;


      default:

        return;
    }

  } catch (error) {
    console.error(
      `[MasterPage] ALTEA header event ${message.type} failed.`,
      error
    );
  }
}


/* ==========================================================================
   INTERNAL SECURITY / NAVIGATION
   ========================================================================== */

function openInternalPath(
  destination
) {
  const path =
    normalizePath(
      destination
    );

  if (!path) {
    throw new Error(
      "Missing internal destination."
    );
  }

  const allowed =
    (
      path ===
        "/riaintra" ||
      path.startsWith(
        "/riaintra/"
      ) ||
      path ===
        "/altea" ||
      path.startsWith(
        "/altea/"
      )
    );

  if (!allowed) {
    throw new Error(
      "Invalid internal destination."
    );
  }

  navigate(
    path
  );
}


async function signOutInternal() {
  try {
    await authentication.logout();
  } finally {
    staffSession =
      null;

    navigate(
      ROUTES.home
    );
  }
}


/* ==========================================================================
   BIND GLOBAL HTML COMPONENTS
   ========================================================================== */

function bindGlobalEmbeds() {
  safeBindMessages(
    CUSTOMER_HEADER_EMBED,
    handleCustomerHeaderMessage
  );

  safeBindMessages(
    CUSTOMER_FOOTER_EMBED,
    handleCustomerFooterMessage
  );

  safeBindMessages(
    RIAINTRA_HEADER_EMBED,
    handleRiaintraHeaderMessage
  );

  safeBindMessages(
    RIAINTRA_FOOTER_EMBED,
    handleRiaintraFooterMessage
  );

  safeBindMessages(
    ALTEA_HEADER_EMBED,
    handleAlteaHeaderMessage
  );
}


/* ==========================================================================
   INITIAL BOOTSTRAP
   ========================================================================== */

async function bootstrapMasterPage() {
  if (
    initialized
  ) {
    return;
  }

  initialized =
    true;

  const path =
    currentPath();

  console.log(
    "[MasterPage] Starting.",
    {
      version:
        MASTER_VERSION,

      path
    }
  );


  /*
   * Bind before requesting sessions so READY events from embeds
   * cannot be lost during startup.
   */
  bindGlobalEmbeds();


  await updateChromeVisibility();


  if (
    isInternalPath(
      path
    )
  ) {

    /*
     * Login screen itself does not require a staff session bootstrap.
     */
    if (
      !isStaffLoginPage(
        path
      )
    ) {
      await loadStaffSession();

      if (
        !staffSession?.authorized
      ) {
        console.warn(
          "[MasterPage] Internal page has no authorized staff session.",
          {
            path
          }
        );
      }

      sendInternalChrome();
    }

    return;
  }


  /*
   * Public website
   */

  await loadCustomerSession();

  sendCustomerChrome();
}


/* ==========================================================================
   MASTER READY
   ========================================================================== */

$w.onReady(
  async function () {

    try {
      await bootstrapMasterPage();

    } catch (error) {

      console.error(
        "[MasterPage] Bootstrap failed.",
        error
      );
    }
  }
);


/* ==========================================================================
   ERROR HELPERS
   ========================================================================== */

function cleanError(
  error
) {
  const message =
    String(
      error?.message ||
      error ||
      ""
    ).trim();

  if (!message) {
    return "Something went wrong.";
  }

  if (
    message.length >
    220
  ) {
    return "Something went wrong. Check site monitoring logs.";
  }

  return message;
}
