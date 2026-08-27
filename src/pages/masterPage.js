// masterPage.js
// SKANDI GLOBAL CHROME CONTROL
// Single source of truth for customer header/footer,
// RIAINTRA navigation, and brand assets.

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


const MASTER_VERSION = "2026.08.27.1";


/* =========================================================
   MASTER CONFIG
========================================================= */

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

    languages: Object.freeze([
      "EN",
      "SV",
      "NO",
      "DA"
    ]),

    currencies: Object.freeze([
      "USD",
      "SEK",
      "NOK",
      "DKK",
      "EUR"
    ]),

    assets: Object.freeze({

      logos: Object.freeze({

        customerHeader:
          "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",

        customerFooter:
          "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",

        skandiPrimary:
          "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",

        skandiWhite:
          "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",

        skandiTravels:
          "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",

        skandiWave: "",
        skandiGroup: "",

        riaintra:
          "https://static.wixstatic.com/media/394052_1024542c47664bff8f4e145d1adf472d~mv2.png",

        altea:
          "https://static.wixstatic.com/media/394052_46045c41aebf421d98314b31ef83c677~mv2.png",

        voy:
          "https://static.wixstatic.com/media/394052_30b8bebbf5ee493da7d47329d04de494~mv2.png",

        voyWhite:
          "https://static.wixstatic.com/media/394052_3770b6753c474d73a77c674b20eab305~mv2.png",

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


  /* =======================================================
     ROUTES
  ======================================================= */

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

    storeCheckout:
      "/the-store/store-checkout",

    storeConfirmation:
      "/the-store/store-checkout/order-confirmation",

    ourNetwork: "/about/our-network",

    legal: "/about/legal",
    policies: "/about/legal/policies",

    riaintra: "/riaintra",
    staffLogin: "/riaintra",

    successFactors:
      "/riaintra/success-factors",

    alteaLaunchpad:
      "/riaintra/success-factors/altea",

    alteaReservations:
      "/riaintra/success-factors/altea/reservations",

    alteaTicketing:
      "/riaintra/success-factors/altea/ticketing",

    alteaTimatic:
      "/riaintra/success-factors/altea/timatic",

    mail:
      "/riaintra/success-factors/mail",

    docunet:
      "/riaintra/success-factors/docunet",

    serviceDesk:
      "/riaintra/success-factors/helpdesk",

    magazineManager:
      "/riaintra/success-factors/media-control"

  }),


  /* =======================================================
     CUSTOMER CHROME
  ======================================================= */

  customer: Object.freeze({

    header: Object.freeze({

      primaryNav: Object.freeze([

        {
          id: "flights",
          label: "Flights",
          path: "/flights"
        },

        {
          id: "hotels",
          label: "Hotels",
          path: "/hotels"
        },

        {
          id: "packages",
          label: "Packages",
          path: "/packages"
        },

        {
          id: "tours",
          label: "Tours & Activities",
          path: "/tours"
        },

        {
          id: "transfers",
          label: "Transfers",
          path: "/transfers"
        }

      ]),

      secondaryNav: Object.freeze([

        {
          id: "destinations",
          label: "Destinations",
          path: "/destinations"
        },

        {
          id: "signature",
          label: "SKANDI Collection",
          path: "/skandi-collection"
        },

        {
          id: "voy",
          label: "VOY Magazine",
          path: "/voy-magazine"
        },

        {
          id: "newsroom",
          label: "Newsroom",
          path: "/about/news-room"
        }

      ]),

      accountNav: Object.freeze([

        {
          id: "myTrip",
          label: "My Trips",
          path: "/my-profile?tab=trips"
        },

        {
          id: "club",
          label: "SKANDI Club",
          path: "/skandi-club"
        }

      ])

    }),


    footer: Object.freeze({

      columns: Object.freeze([

        {
          title: "BOOK & TRAVEL",

          links: Object.freeze([

            {
              label: "Book a trip",
              path: "/"
            },

            {
              label: "Manage your booking",
              path: "/my-profile?tab=trips"
            },

            {
              label: "Our Destinations",
              path: "/destinations"
            },

            {
              label: "Flights",
              path: "/flights"
            },

            {
              label: "Hotels",
              path: "/hotels"
            },

            {
              label: "Tours & Activities",
              path: "/tours"
            },

            {
              label: "Car Rental",
              path: "/car-rental"
            },

            {
              label: "Airport Transfer",
              path: "/transfers"
            },

            {
              label: "Last Chance",
              path: "/offers"
            }

          ])
        },


        {
          title: "HELP & TRAVEL INFO",

          links: Object.freeze([

            {
              label: "Before you travel",
              path: "/travel-info"
            },

            {
              label: "Passport & Visa",
              path: "/travel-info/passport-visa"
            },

            {
              label: "Baggage Allowence",
              path: "/travel-info/baggage-allowence"
            },

            {
              label: "Travel Insurance",
              path: "/travel-info/insurance"
            },

            {
              label: "Special Assistance",
              path: "/travel-info/special-assistance"
            },

            {
              label: "Flight Status",
              path: "/travel-info/flight-status"
            },

            {
              label: "Help Center",
              path: "/about/support"
            }

          ])
        },


        {
          title: "SKANDI",

          links: Object.freeze([

            {
              label: "Join SKANDI Club",
              path: "/skandi-club"
            },

            {
              label: "Log In to My Club",
              path: "/my-profile"
            },

            {
              label: "SKANDI Collection",
              path: "/skandi-collection"
            },

            {
              label: "THE STORE",
              path: "/the-store"
            },

            {
              label: "VOY Magazine",
              path: "/voy-magazine"
            }

          ])
        },


        {
          title: "ABOUT SKANDI",

          links: Object.freeze([

            {
              label: "About SKANDI",
              path: "/about"
            },

            {
              label: "Careers",
              path: "/about/careers"
            },

            {
              label: "Newsroom",
              path: "/about/news-room"
            },

            {
              label: "Our Network",
              path: "/about/our-network"
            }

          ])
        }

      ]),

      staffLogin: Object.freeze({
        label: "Staff Login",
        path: "/riaintra"
      })

    })

  }),


  /* =======================================================
     INTERNAL CHROME
  ======================================================= */

  internal: Object.freeze({

    header: Object.freeze({

      productName:
        "SKANDI TRAVELS",

      productContext:
        "RIAINTRA Enterprise Workforce Suite",

      primaryNav: Object.freeze([

        {
          id: "success-factors",
          label: "SAP RIAINTRA Dashboard",
          path: "/riaintra/success-factors"
        },

        {
          id: "my-roster",
          label: "MyRoster",
          path: "/riaintra/success-factors/my-roster"
        },

        {
          id: "alteaLaunchpad",
          label: "ALTEA",
          path: "/riaintra/success-factors/altea"
        },

        {
          id: "mail",
          label: "Mail",
          path: "/riaintra/success-factors/mail"
        },

        {
          id: "docunet",
          label: "DocuNet",
          path: "/riaintra/success-factors/docunet"
        },

        {
          id: "service-desk",
          label: "ServiceDesk",
          path: "/riaintra/success-factors/helpdesk"
        }

      ]),

      managementNav: Object.freeze([

        {
          id: "magazine-manager",
          label: "Media Manager",
          path: "/riaintra/success-factors/media-control"
        }

      ])

    }),


    footer: Object.freeze({

      links: Object.freeze([

        {
          label: "RIAINTRA",
          path: "/riaintra"
        },

        {
          label: "DocuNet",
          path: "/riaintra/success-factors/docunet"
        },

        {
          label: "ServiceDesk",
          path: "/riaintra/success-factors/helpdesk"
        }

      ])

    })

  })

});


/* =========================================================
   GLOBAL ELEMENT IDS
========================================================= */

const CUSTOMER_HEADER_EMBED =
  "#skandiHeaderEmbed";

const CUSTOMER_HEADER_EMBED_LEGACY =
  "#skandiCustomerHeaderEmbed";

const CUSTOMER_FOOTER_EMBED =
  "#skandiFooterEmbed";

const CUSTOMER_FOOTER_EMBED_LEGACY =
  "#skandiCustomerFooterEmbed";

const RIAINTRA_HEADER_EMBED =
  "#riaintraHeaderEmbed";

const RIAINTRA_FOOTER_EMBED =
  "#riaintraFooterEmbed";

const ALTEA_HEADER_EMBED =
  "#alteaHeaderEmbed";


/* =========================================================
   POSTMESSAGE SOURCES
========================================================= */

const PARENT_SOURCE =
  "SKANDI_WIX_PARENT";

const CUSTOMER_HEADER_SOURCE =
  "SKANDI_CUSTOMER_HEADER_EXPANDBAR";

const CUSTOMER_FOOTER_SOURCE =
  "SKANDI_CUSTOMER_FOOTER";

const ALTEA_HEADER_SOURCE =
  "SKANDI_ALTEA_HEADER";


/* =========================================================
   INTERNAL PATH CONTROL
========================================================= */

const INTERNAL_PREFIXES = [
  "/riaintra",
  "/altea",
  "/_functions"
];

const GROUPTALK_CHROME_FREE_PATHS =
  Object.freeze([
    "/riaintra/success-factors/altea/grouptalk"
  ]);


let alteaRuntimeContext = {};


/* =========================================================
   SAFE ELEMENT HELPERS
========================================================= */

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

    if (element) {
      return element;
    }

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


/* =========================================================
   ALL HTML COMPONENTS
========================================================= */

function allHtmlComponents() {

  try {

    const result =
      $w("HtmlComponent");

    if (!result) {
      return [];
    }

    if (Array.isArray(result)) {
      return result;
    }

    if (
      typeof result[Symbol.iterator] ===
      "function"
    ) {
      return Array.from(result);
    }

    if (
      typeof result.length ===
      "number"
    ) {
      return Array.from(result);
    }

    return [result];

  } catch (error) {

    console.warn(
      "[MasterPage] Could not enumerate HTML Components.",
      error
    );

    return [];
  }

}


/* =========================================================
   CURRENT PAGE
========================================================= */

function currentWixPageInfo() {

  try {

    const page =
      wixSiteFrontend.currentPage || {};

    return {

      name:
        String(page.name || "").trim(),

      url:
        String(page.url || "").trim(),

      type:
        String(page.type || "").trim(),

      isHomePage:
        page.isHomePage === true

    };

  } catch (error) {

    console.warn(
      "[MasterPage] Could not read wixSiteFrontend.currentPage.",
      error
    );

    return {
      name: "",
      url: "",
      type: "",
      isHomePage: false
    };

  }

}


function currentPathString() {

  const page =
    currentWixPageInfo();

  if (
    page.url &&
    page.url.startsWith("/")
  ) {

    return (
      page.url
        .split("?")[0]
        .replace(/\/+$/, "") ||
      "/"
    );

  }

  const path =
    wixLocationFrontend.path || [];

  return "/" + path.join("/");

}


/* =========================================================
   PATH HELPERS
========================================================= */

function isInternalPath(
  path = currentPathString()
) {

  return INTERNAL_PREFIXES.some(
    prefix =>
      path === prefix ||
      path.startsWith(prefix + "/")
  );

}


function isAlteaPath(
  path = currentPathString()
) {

  const value =
    String(path || "").toLowerCase();

  const prefixes = [

    "/riaintra/success-factors/altea",

    "/riaintra/altea",

    "/altea"

  ];

  return prefixes.some(
    prefix =>
      value === prefix ||
      value.startsWith(prefix + "/")
  );

}


function isChromeFreeInternalPath(
  path = currentPathString()
) {

  const value =
    String(path || "")
      .toLowerCase()
      .split("?")[0]
      .replace(/\/+$/, "") ||
    "/";

  return GROUPTALK_CHROME_FREE_PATHS.some(
    groupTalkPath =>
      value === groupTalkPath ||
      value.startsWith(
        groupTalkPath + "/"
      )
  );

}


function isSafeRoute(path) {

  const value =
    String(path || "").trim();

  return Boolean(

    value &&

    value.startsWith("/") &&

    !value.startsWith("//") &&

    !/^(javascript|data|vbscript):/i.test(
      value
    )

  );

}


/* =========================================================
   POST TO HTML EMBED
========================================================= */

function postToEmbed(
  embed,
  type,
  payload = {}
) {

  if (
    !embed ||
    typeof embed.postMessage !== "function"
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
        new Date().toISOString()

    });

    return true;

  } catch (error) {

    console.warn(
      `[MasterPage] postMessage failed for ${
        embed.id || "unknown embed"
      }.`,
      error
    );

    return false;

  }

}


/* =========================================================
   MASTER PAYLOAD
========================================================= */

function masterPayload(extra = {}) {

  const page =
    currentWixPageInfo();

  const path =
    currentPathString();

  const altea =
    isAlteaPath(path);

  return {

    version:
      MASTER_VERSION,

    mode:
      isInternalPath(path)
        ? "internal"
        : "customer",

    isInternal:
      isInternalPath(path),

    isAltea:
      altea,

    currentPath:
      path,

    currentPage:
      page,

    brand:
      MASTER_CONFIG.brand,

    routes:
      MASTER_CONFIG.routes,

    customer:
      MASTER_CONFIG.customer,

    internal:
      MASTER_CONFIG.internal,

    altea: {

      ...(altea
        ? {
            systemName:
              page.name || "",

            pageName:
              page.name || "",

            pageUrl:
              page.url || ""
          }
        : {}),

      ...alteaRuntimeContext

    },

    ...extra

  };

}


function pushMasterConfig(
  embed,
  extra = {}
) {

  postToEmbed(
    embed,
    "SKANDI_MASTER_CONFIG",
    masterPayload(extra)
  );

}


/* =========================================================
   CUSTOMER HEADER
========================================================= */

function closeCustomerHeaderPanels() {

  postToEmbed(
    customerHeaderEl(),
    "CLOSE_CUSTOMER_HEADER_PANELS",
    {}
  );

}


/* =========================================================
   NAVIGATION
========================================================= */

function navigate(path) {

  const value =
    String(path || "").trim();

  if (!isSafeRoute(value)) {

    console.warn(
      "[MasterPage] Blocked unsafe navigation path:",
      value
    );

    return;
  }

  closeCustomerHeaderPanels();

  wixLocationFrontend.to(value);

}


/* =========================================================
   CUSTOMER SESSION
========================================================= */

async function getCustomerState() {

  try {

    const member =
      await currentMember.getMember();

    if (!member) {

      return {
        loggedIn: false,
        displayName: "",
        points: 0,
        tierName: "",
        menu: []
      };

    }

    const session =
      await getCustomerHeaderSession();

    return {

      loggedIn: true,

      displayName:
        session?.displayName ||
        member?.profile?.nickname ||
        member?.loginEmail ||
        "",

      points:
        Number(
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

    console.warn(
      "[MasterPage] Customer session unavailable.",
      error
    );

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

  if (!embed) {
    return;
  }

  postToEmbed(
    embed,
    "CUSTOMER_HEADER_STATE",
    await getCustomerState()
  );

}


/* =========================================================
   STAFF SESSION
========================================================= */

async function getStaffState() {

  try {

    const result =
      await getStaffPortalSession();

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

      profile:
        result.profile || {},

      permissions:
        result.permissions || [],

      apps:
        result.apps || []

    };

  } catch (error) {

    console.warn(
      "[MasterPage] Staff session unavailable.",
      error
    );

    return {
      authorized: false,
      profile: {}
    };

  }

}


async function pushStaffHeaderState(
  embed = safeEl(
    RIAINTRA_HEADER_EMBED
  )
) {

  if (!embed) {
    return;
  }

  const staff =
    await getStaffState();

  pushMasterConfig(
    embed,
    { staff }
  );

  postToEmbed(
    embed,
    "RIAINTRA_HEADER_STATE",
    {

      ...staff,

      navigation:
        MASTER_CONFIG.internal.header,

      assets:
        MASTER_CONFIG.brand.assets

    }
  );

}


/* =========================================================
   HANDLE HTML MESSAGES
========================================================= */

async function handleMasterMessage(
  embed,
  message = {}
) {

  const type =
    String(message?.type || "");

  const source =
    String(message?.source || "");

  const payload =
    message?.payload &&
    typeof message.payload === "object"
      ? message.payload
      : {};


  /* -------------------------------------------------------
     MASTER CONFIG REQUEST
  ------------------------------------------------------- */

  if (
    type === "MASTER_CONFIG_REQUEST" ||
    type === "SKANDI_MASTER_CONFIG_REQUEST"
  ) {

    const extra =
      isInternalPath()
        ? {
            staff:
              await getStaffState()
          }
        : {
            customerSession:
              await getCustomerState()
          };

    pushMasterConfig(
      embed,
      extra
    );


    if (
      source === ALTEA_HEADER_SOURCE &&
      isAlteaPath()
    ) {

      const page =
        currentWixPageInfo();

      const staff =
        extra.staff || {};

      postToEmbed(
        embed,
        "ALTEA_HEADER_CONTEXT",
        {

          systemName:
            page.name || "ALTEA",

          pageName:
            page.name || "",

          pageUrl:
            page.url || "",

          station:
  alteaRuntimeContext.station ||
  staff?.profile?.station ||
  staff?.profile?.stationCode ||
  "",

          timeZone:
            alteaRuntimeContext.timeZone ||
            staff?.profile?.timeZone ||
            ""

        }
      );

    }

    return true;

  }


  /* -------------------------------------------------------
     ASSETS REQUEST
  ------------------------------------------------------- */

  if (
    type === "MASTER_ASSETS_REQUEST"
  ) {

    postToEmbed(
      embed,
      "SKANDI_MASTER_ASSETS",
      MASTER_CONFIG.brand.assets
    );

    return true;

  }


  /* -------------------------------------------------------
     NAVIGATION CONFIG REQUEST
  ------------------------------------------------------- */

  if (
    type === "MASTER_NAVIGATION_REQUEST"
  ) {

    postToEmbed(
      embed,
      "SKANDI_MASTER_NAVIGATION",
      {

        customer:
          MASTER_CONFIG.customer,

        internal:
          MASTER_CONFIG.internal,

        routes:
          MASTER_CONFIG.routes,

        currentPath:
          currentPathString()

      }
    );

    return true;

  }


  /* -------------------------------------------------------
     ALTEA CONTEXT
  ------------------------------------------------------- */

  if (
    type === "ALTEA_SYSTEM_CONTEXT" &&
    isInternalPath()
  ) {

    const clean = {

      systemName:
        String(
          payload.systemName || ""
        )
          .trim()
          .slice(0, 80),

      systemContext:
        String(
          payload.systemContext || ""
        )
          .trim()
          .slice(0, 120),

      station:
        String(
          payload.station || ""
        )
          .trim()
          .toUpperCase()
          .slice(0, 12),

      timeZone:
        String(
          payload.timeZone || ""
        )
          .trim()
          .slice(0, 80)

    };


    alteaRuntimeContext = {

      ...alteaRuntimeContext,

      ...Object.fromEntries(

        Object.entries(clean)
          .filter(
            ([, value]) =>
              Boolean(value)
          )

      )

    };


    const alteaHeader =
      safeEl(
        ALTEA_HEADER_EMBED
      );


    if (alteaHeader) {

      postToEmbed(
        alteaHeader,
        "ALTEA_HEADER_CONTEXT",
        alteaRuntimeContext
      );

    }

    return true;

  }


  /* -------------------------------------------------------
     GENERIC NAVIGATION
  ------------------------------------------------------- */

  if (
    type === "MASTER_NAVIGATE"
  ) {

    navigate(
      message.path ||
      payload.path ||
      ""
    );

    return true;

  }


  /* -------------------------------------------------------
     HEADER EMBED RESIZE
  ------------------------------------------------------- */

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


  /* -------------------------------------------------------
     CUSTOMER HEADER
  ------------------------------------------------------- */

  if (
    source === CUSTOMER_HEADER_SOURCE
  ) {

    switch (type) {


      case "HEADER_READY":

        pushMasterConfig(
          embed,
          {
            customerSession:
              await getCustomerState()
          }
        );

        await pushCustomerHeaderState(
          embed
        );

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

          await authentication
            .promptLogin();

        } catch (_) {}

        await pushCustomerHeaderState(
          embed
        );

        return true;


      case "HEADER_LOGIN_SUBMIT":

        try {

          await authentication.login(

            message.email ||
            payload.email,

            message.password ||
            payload.password

          );

          await pushCustomerHeaderState(
            embed
          );

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

          await authentication
            .promptForgotPassword();

        } catch (_) {}

        return true;


      case "HEADER_LOGOUT":

        closeCustomerHeaderPanels();

        try {

          await authentication
            .logout();

        } catch (_) {}

        wixLocationFrontend.to(
          MASTER_CONFIG.routes.home
        );

        return true;


      default:
        break;

    }

  }


  /* -------------------------------------------------------
     CUSTOMER FOOTER
  ------------------------------------------------------- */

  if (
    source === CUSTOMER_FOOTER_SOURCE
  ) {

    switch (type) {


      case "FOOTER_READY":

        pushMasterConfig(embed);

        postToEmbed(
          embed,
          "CUSTOMER_FOOTER_STATE",
          {

            ready: true,

            navigation:
              MASTER_CONFIG
                .customer
                .footer,

            assets:
              MASTER_CONFIG
                .brand
                .assets

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


  /* -------------------------------------------------------
     RIAINTRA HEADER
  ------------------------------------------------------- */

  if (
    type === "RIAINTRA_HEADER_READY" ||
    type === "INTERNAL_HEADER_READY"
  ) {

    await pushStaffHeaderState(
      embed
    );

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

      await authentication
        .logout();

    } catch (_) {}

    wixLocationFrontend.to(
      MASTER_CONFIG.routes.home
    );

    return true;

  }


  return false;

}


/* =========================================================
   WIRE HTML COMPONENTS
========================================================= */

const wiredEmbedIds =
  new Set();


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


  if (
    wiredEmbedIds.has(key)
  ) {
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


  // Push immediately.
  // HTML also requests config using MASTER_CONFIG_REQUEST.
  pushMasterConfig(embed);

}


/* =========================================================
   WIRE ALL HTML COMPONENTS
========================================================= */

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


  if (
    isChromeFreeInternalPath()
  ) {

    components

      .filter(
        embed => {

          const id =
            String(
              embed?.id || ""
            )
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

    safeEl(
      RIAINTRA_HEADER_EMBED
    ),

    safeEl(
      RIAINTRA_FOOTER_EMBED
    ),

    safeEl(
      ALTEA_HEADER_EMBED
    ),

    ...components

  ]

    .filter(Boolean)

    .forEach(
      wireHtmlComponent
    );

}


/* =========================================================
   SHOW / HIDE HELPERS
========================================================= */

async function showChromeElement(
  element
) {

  if (!element) {
    return;
  }


  try {

    if (
      typeof element.expand ===
      "function"
    ) {

      await element.expand();

    }

  } catch (_) {}


  try {

    if (
      typeof element.show ===
      "function"
    ) {

      await element.show();

    }

  } catch (_) {}

}


async function hideChromeElement(
  element
) {

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

  } catch (_) {}


  try {

    if (
      typeof element.collapse ===
      "function"
    ) {

      await element.collapse();

    }

  } catch (_) {}

}


/* =========================================================
   APPLY GLOBAL CHROME VISIBILITY
========================================================= */

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
    safeEl(
      RIAINTRA_HEADER_EMBED
    );

  const riaFooter =
    safeEl(
      RIAINTRA_FOOTER_EMBED
    );

  const alteaHeader =
    safeEl(
      ALTEA_HEADER_EMBED
    );


  /* -------------------------------------------------------
     GROUPTALK OWNS FULL VIEWPORT
  ------------------------------------------------------- */

  if (
    isChromeFreeInternalPath()
  ) {

    await hideChromeElement(
      customerHeader
    );

    await hideChromeElement(
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

    return;

  }


  /* -------------------------------------------------------
     INTERNAL
  ------------------------------------------------------- */

  if (internal) {

    await hideChromeElement(
      customerHeader
    );

    await hideChromeElement(
      customerFooter
    );


    await showChromeElement(
      riaHeader
    );

    await showChromeElement(
      riaFooter
    );


    if (altea) {

      await showChromeElement(
        alteaHeader
      );


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

  }


  /* -------------------------------------------------------
     CUSTOMER
  ------------------------------------------------------- */

  else {

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
        customerFooter
      );

    }

  }

}


/* =========================================================
   MASTER PAGE READY
========================================================= */

$w.onReady(
  async function () {

    const page =
      currentWixPageInfo();


    console.log(
      "[MasterPage] Current Wix page:",
      {

        name:
          page.name,

        url:
          page.url,

        type:
          page.type,

        isAltea:
          isAlteaPath()

      }
    );


    /* -----------------------------------------------------
       1. Wire HTML communication
    ----------------------------------------------------- */

    wireAllHtmlComponents();


    /* -----------------------------------------------------
       2. Show correct header/footer
    ----------------------------------------------------- */

    await applyChromeVisibility();


    /* -----------------------------------------------------
       3. Update header after login
    ----------------------------------------------------- */

    authentication.onLogin(
      async () => {

        if (
          isChromeFreeInternalPath()
        ) {
          return;
        }


        if (
          isInternalPath()
        ) {

          await pushStaffHeaderState();

        } else {

          await pushCustomerHeaderState();

        }

      }
    );


    /* -----------------------------------------------------
       4. Re-push master config after iframe startup
    ----------------------------------------------------- */

    setTimeout(
      () => {

        if (
          isChromeFreeInternalPath()
        ) {
          return;
        }


        allHtmlComponents()
          .forEach(
            embed =>
              pushMasterConfig(
                embed
              )
          );

      },
      500
    );

  }
);
