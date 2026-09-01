// masterPage.js
// SKANDI CUSTOMER CHROME BRIDGE
// Customer header/footer + first-visit language/currency popup

import wixLocationFrontend from "wix-location-frontend";
import wixWindowFrontend from "wix-window-frontend";

import {
  currentMember,
  authentication
} from "wix-members-frontend";


/* =========================================================
   CONSTANTS
========================================================= */

const PARENT_SOURCE =
  "SKANDI_WIX_PARENT";

const HEADER_SOURCE =
  "SKANDI_CUSTOMER_HEADER_EXPANDBAR";

const FOOTER_SOURCE =
  "SKANDI_CUSTOMER_FOOTER";

const SETTINGS_LIGHTBOX_NAME =
  "SKANDI Language & Currency";

const MASTER_VERSION =
  "2026.08.31.1";

const ALLOWED_LANGUAGES =
  new Set([
    "EN",
    "SV",
    "NO",
    "DA"
  ]);

const ALLOWED_CURRENCIES =
  new Set([
    "USD",
    "SEK",
    "NOK",
    "DKK",
    "EUR"
  ]);


/* =========================================================
   RUNTIME
========================================================= */

const wiredEmbeds =
  new WeakSet();

const headerEmbeds =
  new Set();

let settingsPopupPromise =
  null;


/* =========================================================
   MASTER CONFIG
========================================================= */

const MASTER_CONFIG = {

  version:
    MASTER_VERSION,

  brand: {

    groupName:
      "SKANDI Group",

    travelName:
      "SKANDI Travels",

    slogans: {
      en:
        "Unforgettable Moments",

      sv:
        "När du längtar bort",

      no:
        "Når du lengter bort",

      da:
        "Når du længes væk",

      fi:
        "Kun kaipaat pois"
    },

    languages: [
      "EN",
      "SV",
      "NO",
      "DA"
    ],

    currencies: [
      "USD",
      "SEK",
      "NOK",
      "DKK",
      "EUR"
    ],

    assets: {

      logos: {

        customerHeader:
          "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",

        customerFooter:
          "https://static.wixstatic.com/media/394052_fafffe6d26434eddbf62eb645ee9c844~mv2.png",

        skandiPrimary:
          "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",

        riaintraLight:
          "https://static.wixstatic.com/media/394052_635532ed8a8d446ab22f4fc09ef65858~mv2.png",

        skandiTravels:
          "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png"
      }

    }

  },


  routes: {

    home:
      "/home",

    search:
      "/search",

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

    carRental:
      "/car-rental",

    destinations:
      "/destinations",

    skandiCollection:
      "/skandi-collection",

    voy:
      "/voy-magazine",

    newsroom:
      "/about/news-room",

    myTrip:
      "/my-profile?tab=trips",

    club:
      "/skandi-club",

    support:
      "/about/support",

    about:
      "/about",

    legal:
      "/about/legal",

    riaintra:
      "/riaintra"
  },


  customer: {

    header: {

      primaryNav: [

        {
          id:
            "destinations",

          label:
            "Destinations",

          path:
            "/destinations"
        },

        {
          id:
            "tours",

          label:
            "Tours & Activities",

          path:
            "/tours"
        },

        {
          id:
            "travelInfo",

          label:
            "Travel Info",

          path:
            "/travel-info"
        },

        {
          id:
            "signature",

          label:
            "SKANDI Collection",

          path:
            "/skandi-collection"
        }

      ],


      accountNav: [

        {
          id:
            "myTrip",

          label:
            "My Trips",

          path:
            "/my-profile?tab=trips"
        },

        {
          id:
            "club",

          label:
            "SKANDI Club",

          path:
            "/skandi-club"
        }

      ]

    },


    footer: {

      newsletter: {

        title:
          "Get SKANDI offers and travel inspiration",

        description:
          "Receive destination guides, Signature Collection updates and member offers.",

        placeholder:
          "Email address",

        buttonLabel:
          "Sign up"
      },


      columns: [

        {
          title:
            "BOOK & TRAVEL",

          links: [

            {
              label:
                "Book a trip",

              path:
                "/"
            },

            {
              label:
                "Manage your booking",

              path:
                "/my-profile?tab=trips"
            },

            {
              label:
                "Our Destinations",

              path:
                "/destinations"
            },

            {
              label:
                "Flights",

              path:
                "/flights"
            },

            {
              label:
                "Hotels",

              path:
                "/hotels"
            },

            {
              label:
                "Tours & Activities",

              path:
                "/tours"
            },

            {
              label:
                "Car Rental",

              path:
                "/car-rental"
            },

            {
              label:
                "Airport Transfer",

              path:
                "/transfers"
            }

          ]
        },


        {
          title:
            "HELP & TRAVEL INFO",

          links: [

            {
              label:
                "Before you travel",

              path:
                "/travel-info"
            },

            {
              label:
                "Passport & Visa",

              path:
                "/travel-info/passport-visa"
            },

            {
              label:
                "Baggage Allowance",

              path:
                "/travel-info/baggage-allowence"
            },

            {
              label:
                "Travel Insurance",

              path:
                "/travel-info/insurance"
            },

            {
              label:
                "Special Assistance",

              path:
                "/travel-info/special-assistance"
            },

            {
              label:
                "Flight Status",

              path:
                "/travel-info/flight-status"
            },

            {
              label:
                "Help Center",

              path:
                "/about/support"
            }

          ]
        },


        {
          title:
            "SKANDI",

          links: [

            {
              label:
                "Join SKANDI Club",

              path:
                "/skandi-club"
            },

            {
              label:
                "Log In to My Club",

              path:
                "/my-profile"
            },

            {
              label:
                "SKANDI Collection",

              path:
                "/skandi-collection"
            },

            {
              label:
                "THE STORE",

              path:
                "/the-store"
            },

            {
              label:
                "VOY Magazine",

              path:
                "/voy-magazine"
            }

          ]
        },


        {
          title:
            "ABOUT SKANDI",

          links: [

            {
              label:
                "About SKANDI",

              path:
                "/about"
            },

            {
              label:
                "Careers",

              path:
                "/about/careers"
            },

            {
              label:
                "Newsroom",

              path:
                "/about/news-room"
            },

            {
              label:
                "Our Network",

              path:
                "/about/our-network"
            }

          ]
        }

      ],


      bottomLinks: [

        {
          label:
            "Legal",

          path:
            "/about/legal"
        },

        {
          label:
            "Privacy",

          path:
            "/about/legal/policies?policy=privacy"
        },

        {
          label:
            "Terms",

          path:
            "/about/legal/policies?policy=terms"
        },

        {
          label:
            "Accessibility",

          path:
            "/about/legal/policies?policy=accessibility"
        },

        {
          label:
            "Staff Login",

          path:
            "/riaintra"
        }

      ]

    }

  }

};


/* =========================================================
   PATH
========================================================= */

function currentPath() {

  try {

    const path =
      wixLocationFrontend.path ||
      [];

    return (
      "/" +
      path.join("/")
    );

  } catch (_) {

    return "/";

  }

}


function isInternalPath() {

  const path =
    currentPath()
      .toLowerCase();

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


/* =========================================================
   MESSAGE UTILITIES
========================================================= */

function parseMessage(
  data
) {

  if (
    typeof data ===
    "string"
  ) {

    try {

      return JSON.parse(
        data
      );

    } catch (_) {

      return null;

    }

  }


  if (
    data &&
    typeof data ===
      "object"
  ) {

    return data;

  }


  return null;

}


function post(
  embed,
  type,
  payload = {}
) {

  if (
    !embed ||
    typeof embed.postMessage !==
      "function"
  ) {

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
          .toISOString()

    });


    return true;

  } catch (error) {

    console.error(
      "[SKANDI MASTER] postMessage failed",
      embed?.id,
      error
    );

    return false;

  }

}


/* =========================================================
   MASTER PAYLOAD
========================================================= */

function masterPayload() {

  return {

    ...MASTER_CONFIG,

    currentPath:
      currentPath(),

    mode:
      isInternalPath()
        ? "internal"
        : "customer",

    isInternal:
      isInternalPath()

  };

}


function sendMasterConfig(
  embed
) {

  console.log(
    "[SKANDI MASTER] sending config to",
    embed?.id ||
      "unknown"
  );


  post(
    embed,
    "SKANDI_MASTER_CONFIG",
    masterPayload()
  );

}


/* =========================================================
   CUSTOMER STATE
========================================================= */

async function getCustomerState() {

  try {

    const member =
      await currentMember
        .getMember();


    if (!member) {

      return {

        loggedIn:
          false,

        displayName:
          "",

        email:
          "",

        points:
          0,

        tierName:
          "",

        menu:
          []

      };

    }


    const displayName =

      member
        ?.profile
        ?.nickname ||

      member
        ?.profile
        ?.firstName ||

      member
        ?.contactDetails
        ?.firstName ||

      member
        ?.loginEmail ||

      "Member";


    const email =
      String(
        member?.loginEmail ||
        ""
      )
        .trim();


    return {

      loggedIn:
        true,

      displayName,

      email,

      points:
        0,

      tierName:
        "",

      menu:
        []

    };


  } catch (error) {

    console.warn(
      "[SKANDI MASTER] Member state unavailable",
      error
    );


    return {

      loggedIn:
        false,

      displayName:
        "",

      email:
        "",

      points:
        0,

      tierName:
        "",

      menu:
        []

    };

  }

}


async function sendHeaderState(
  embed
) {

  post(
    embed,
    "CUSTOMER_HEADER_STATE",
    await getCustomerState()
  );

}


/* =========================================================
   INITIAL LANGUAGE / CURRENCY
========================================================= */

function normalizeLanguage(
  value
) {

  const result =
    String(
      value ||
      "EN"
    )
      .trim()
      .toUpperCase();


  return ALLOWED_LANGUAGES
    .has(result)
      ? result
      : "EN";

}


function normalizeCurrency(
  value
) {

  const result =
    String(
      value ||
      "USD"
    )
      .trim()
      .toUpperCase();


  return ALLOWED_CURRENCIES
    .has(result)
      ? result
      : "USD";

}


function normalizeSettings(
  value = {}
) {

  return {

    language:
      normalizeLanguage(
        value.language
      ),

    currency:
      normalizeCurrency(
        value.currency
      )

  };

}


function sendSettingsToHeaders(
  settings
) {

  const normalized =
    normalizeSettings(
      settings
    );


  for (
    const embed
    of headerEmbeds
  ) {

    post(
      embed,
      "CUSTOMER_SETTINGS_APPLY",
      normalized
    );

  }

}


async function openInitialSettingsPopup(
  requestingEmbed,
  payload = {}
) {

  if (
    isInternalPath()
  ) {

    return;

  }


  if (
    requestingEmbed
  ) {

    headerEmbeds.add(
      requestingEmbed
    );

  }


  /*
   * Header can fire READY / MASTER request more than once.
   * Never open duplicate popups.
   */
  if (
    settingsPopupPromise
  ) {

    return settingsPopupPromise;

  }


  const defaults =
    normalizeSettings(
      payload
    );


  console.log(
    "[SKANDI MASTER] opening initial settings popup",
    defaults
  );


  settingsPopupPromise =
    wixWindowFrontend
      .openLightbox(
        SETTINGS_LIGHTBOX_NAME,
        defaults
      )
      .then(
        result => {

          if (
            !result ||
            typeof result !==
              "object"
          ) {

            console.warn(
              "[SKANDI MASTER] settings popup closed without result"
            );

            return null;

          }


          const language =
            String(
              result.language ||
              ""
            )
              .trim()
              .toUpperCase();

          const currency =
            String(
              result.currency ||
              ""
            )
              .trim()
              .toUpperCase();


          if (
            !ALLOWED_LANGUAGES
              .has(language) ||
            !ALLOWED_CURRENCIES
              .has(currency)
          ) {

            console.warn(
              "[SKANDI MASTER] rejected invalid popup result",
              result
            );

            return null;

          }


          const settings = {
            language,
            currency
          };


          console.log(
            "[SKANDI MASTER] initial settings selected",
            settings
          );


          /*
           * Send result back to every known customer-header
           * instance. The header owns localStorage.
           */
          sendSettingsToHeaders(
            settings
          );


          /*
           * Also send directly to the requesting embed in case
           * it has not yet been registered in the set.
           */
          if (
            requestingEmbed
          ) {

            post(
              requestingEmbed,
              "CUSTOMER_SETTINGS_APPLY",
              settings
            );

          }


          return settings;

        }
      )
      .catch(
        error => {

          console.error(
            "[SKANDI MASTER] initial settings popup failed",
            error
          );

          return null;

        }
      )
      .finally(
        () => {

          settingsPopupPromise =
            null;

        }
      );


  return settingsPopupPromise;

}


/* =========================================================
   NAVIGATION
========================================================= */

function navigate(
  rawPath
) {

  const path =
    String(
      rawPath ||
      ""
    )
      .trim();


  if (!path) {

    return;

  }


  if (

    !path.startsWith("/") ||

    path.startsWith("//") ||

    /^(javascript|data|vbscript):/i
      .test(path)

  ) {

    console.warn(
      "[SKANDI MASTER] blocked navigation",
      path
    );

    return;

  }


  console.log(
    "[SKANDI MASTER] navigate",
    path
  );


  wixLocationFrontend
    .to(path);

}


/* =========================================================
   SHOW / HIDE CUSTOMER CHROME
========================================================= */

async function showEmbed(
  embed
) {

  if (!embed) {

    return;

  }


  try {

    if (
      typeof embed.expand ===
      "function"
    ) {

      await embed.expand();

    }

  } catch (_) {}


  try {

    if (
      typeof embed.show ===
      "function"
    ) {

      await embed.show();

    }

  } catch (_) {}

}


async function hideEmbed(
  embed
) {

  if (!embed) {

    return;

  }


  try {

    if (
      typeof embed.hide ===
      "function"
    ) {

      await embed.hide();

    }

  } catch (_) {}


  try {

    if (
      typeof embed.collapse ===
      "function"
    ) {

      await embed.collapse();

    }

  } catch (_) {}

}


async function syncCustomerChrome(
  embed,
  source
) {

  if (

    source !==
      HEADER_SOURCE &&

    source !==
      FOOTER_SOURCE

  ) {

    return;

  }


  if (
    isInternalPath()
  ) {

    await hideEmbed(
      embed
    );

  } else {

    await showEmbed(
      embed
    );

  }

}


/* =========================================================
   SEARCH
========================================================= */

function runSearch(
  message,
  payload
) {

  const query =
    String(

      payload?.query ||

      message?.query ||

      payload?.value ||

      message?.value ||

      ""

    )
      .trim();


  if (!query) {

    navigate(
      "/search"
    );

    return;

  }


  navigate(
    `/search?q=${encodeURIComponent(
      query
    )}`
  );

}


/* =========================================================
   HANDLE MESSAGE
========================================================= */

async function handleMessage(
  embed,
  event
) {

  const message =
    parseMessage(
      event?.data
    );


  if (!message) {

    return;

  }


  const source =
    String(
      message.source ||
      ""
    );


  const type =
    String(
      message.type ||
      ""
    );


  const payload =

    message.payload &&

    typeof message.payload ===
      "object"

      ? message.payload

      : {};


  if (
    source ===
    HEADER_SOURCE
  ) {

    headerEmbeds.add(
      embed
    );

  }


  console.log(
    "[SKANDI MASTER] message",
    {
      embed:
        embed?.id || "",
      source,
      type
    }
  );


  await syncCustomerChrome(
    embed,
    source
  );


  /* -------------------------------------------------------
     INITIAL LANGUAGE/CURRENCY
  ------------------------------------------------------- */

  if (

    source ===
      HEADER_SOURCE &&

    type ===
      "INITIAL_SETTINGS_REQUIRED"

  ) {

    await openInitialSettingsPopup(
      embed,
      payload
    );

    return;

  }


  /* -------------------------------------------------------
     SETTINGS UPDATED
  ------------------------------------------------------- */

  if (

    source ===
      HEADER_SOURCE &&

    type ===
      "UPDATE_SETTINGS"

  ) {

    console.log(
      "[SKANDI MASTER] customer settings updated",
      normalizeSettings(
        payload
      )
    );

    return;

  }


  /* -------------------------------------------------------
     GENERIC MASTER REQUEST
  ------------------------------------------------------- */

  if (

    type ===
      "MASTER_CONFIG_REQUEST" ||

    type ===
      "SKANDI_MASTER_CONFIG_REQUEST"

  ) {

    sendMasterConfig(
      embed
    );


    if (
      source ===
      HEADER_SOURCE
    ) {

      await sendHeaderState(
        embed
      );

    }


    if (
      source ===
      FOOTER_SOURCE
    ) {

      post(
        embed,
        "CUSTOMER_FOOTER_STATE",
        {
          ready:
            true
        }
      );

    }


    return;

  }


  /* -------------------------------------------------------
     HEADER READY
  ------------------------------------------------------- */

  if (

    source ===
      HEADER_SOURCE &&

    type ===
      "HEADER_READY"

  ) {

    headerEmbeds.add(
      embed
    );


    sendMasterConfig(
      embed
    );


    await sendHeaderState(
      embed
    );


    return;

  }


  /* -------------------------------------------------------
     FOOTER READY
  ------------------------------------------------------- */

  if (

    source ===
      FOOTER_SOURCE &&

    type ===
      "FOOTER_READY"

  ) {

    sendMasterConfig(
      embed
    );


    post(
      embed,
      "CUSTOMER_FOOTER_STATE",
      {
        ready:
          true
      }
    );


    return;

  }


  /* -------------------------------------------------------
     HEADER NAVIGATION
  ------------------------------------------------------- */

  if (

    source ===
      HEADER_SOURCE &&

    type ===
      "HEADER_NAVIGATE"

  ) {

    navigate(
      payload.path ||
      message.path
    );

    return;

  }


  /* -------------------------------------------------------
     SEARCH
  ------------------------------------------------------- */

  if (

    source ===
      HEADER_SOURCE &&

    type ===
      "HEADER_SEARCH"

  ) {

    runSearch(
      message,
      payload
    );

    return;

  }


  /* -------------------------------------------------------
     LOGIN
  ------------------------------------------------------- */

  if (

    source ===
      HEADER_SOURCE &&

    type ===
      "HEADER_LOGIN"

  ) {

    try {

      await authentication
        .promptLogin();

    } catch (_) {}


    await sendHeaderState(
      embed
    );


    return;

  }


  if (

    source ===
      HEADER_SOURCE &&

    type ===
      "HEADER_LOGIN_SUBMIT"

  ) {

    const email =
      String(

        payload.email ||

        message.email ||

        ""

      )
        .trim();


    const password =
      String(

        payload.password ||

        message.password ||

        ""

      );


    try {

      await authentication
        .login(
          email,
          password
        );


      await sendHeaderState(
        embed
      );


    } catch (error) {

      console.warn(
        "[SKANDI MASTER] customer login failed",
        error
      );


      post(
        embed,
        "HOME_ERROR",
        {
          message:
            "Invalid email or password. Please try again."
        }
      );

    }


    return;

  }


  if (

    source ===
      HEADER_SOURCE &&

    type ===
      "HEADER_FORGOT_PASSWORD"

  ) {

    try {

      await authentication
        .promptForgotPassword();

    } catch (_) {}


    return;

  }


  if (

    source ===
      HEADER_SOURCE &&

    type ===
      "HEADER_LOGOUT"

  ) {

    try {

      await authentication
        .logout();

    } catch (_) {}


    await sendHeaderState(
      embed
    );


    navigate(
      "/"
    );


    return;

  }


  /* -------------------------------------------------------
     HEADER HEIGHT
     Still retained for normal header dropdown/menu behavior.
     The initial site popup no longer uses this.
  ------------------------------------------------------- */

  if (

    source ===
      HEADER_SOURCE &&

    type ===
      "SKANDI_EMBED_RESIZE"

  ) {

    const requested =
      Number(
        payload.height
      );


    if (
      Number.isFinite(
        requested
      )
    ) {

      try {

        embed.height =
          Math.max(
            118,
            Math.min(
              1200,
              Math.round(
                requested
              )
            )
          );

      } catch (_) {}

    }


    return;

  }


  /* -------------------------------------------------------
     FOOTER NAVIGATION
  ------------------------------------------------------- */

  if (

    source ===
      FOOTER_SOURCE &&

    type ===
      "FOOTER_NAVIGATE"

  ) {

    navigate(
      payload.path ||
      message.path
    );

    return;

  }


  if (

    source ===
      FOOTER_SOURCE &&

    type ===
      "FOOTER_STAFF_LOGIN"

  ) {

    navigate(
      "/riaintra"
    );

    return;

  }


  /* -------------------------------------------------------
     MASTER NAVIGATION
  ------------------------------------------------------- */

  if (
    type ===
    "MASTER_NAVIGATE"
  ) {

    navigate(
      payload.path ||
      message.path
    );

  }

}


/* =========================================================
   WIRE EVERY HTML COMPONENT
========================================================= */

function wireEmbed(
  embed
) {

  if (

    !embed ||

    wiredEmbeds.has(
      embed
    ) ||

    typeof embed.onMessage !==
      "function"

  ) {

    return;

  }


  wiredEmbeds.add(
    embed
  );


  console.log(
    "[SKANDI MASTER] wiring HTML component",
    embed.id
  );


  embed.onMessage(
    async event => {

      try {

        await handleMessage(
          embed,
          event
        );

      } catch (error) {

        console.error(
          "[SKANDI MASTER] message failure",
          embed?.id,
          error
        );

      }

    }
  );

}


/* =========================================================
   PUSH HEADER STATE TO REGISTERED HEADERS
========================================================= */

async function refreshAllHeaderStates() {

  const state =
    await getCustomerState();


  for (
    const embed
    of headerEmbeds
  ) {

    post(
      embed,
      "CUSTOMER_HEADER_STATE",
      state
    );

  }

}


/* =========================================================
   READY
========================================================= */

$w.onReady(
  async function () {

    console.log(
      "[SKANDI MASTER] READY",
      MASTER_VERSION,
      currentPath()
    );


    let components =
      [];


    try {

      components =
        $w(
          "HtmlComponent"
        ) || [];

    } catch (error) {

      console.error(
        "[SKANDI MASTER] HtmlComponent selector failed",
        error
      );

    }


    console.log(
      "[SKANDI MASTER] HTML COMPONENT COUNT:",
      components.length
    );


    components.forEach(
      wireEmbed
    );


    /*
     * Retry because global/page HTML components can finish
     * initialization slightly after masterPage ready.
     */
    setTimeout(
      () => {

        try {

          const later =
            $w(
              "HtmlComponent"
            ) || [];


          later.forEach(
            wireEmbed
          );


          console.log(
            "[SKANDI MASTER] RETRY COMPONENT COUNT:",
            later.length
          );


        } catch (error) {

          console.error(
            "[SKANDI MASTER] retry failed",
            error
          );

        }

      },
      1000
    );


    authentication.onLogin(
      async () => {

        try {

          await refreshAllHeaderStates();

        } catch (_) {}

      }
    );

  }
);
