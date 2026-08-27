// masterPage.js
// SKANDI CUSTOMER CHROME BRIDGE
// ID-independent, backend-independent version.

import wixLocationFrontend from "wix-location-frontend";
import {
  currentMember,
  authentication
} from "wix-members-frontend";


/* =========================================================
   CONSTANTS
========================================================= */

const PARENT_SOURCE = "SKANDI_WIX_PARENT";

const HEADER_SOURCE =
  "SKANDI_CUSTOMER_HEADER_EXPANDBAR";

const FOOTER_SOURCE =
  "SKANDI_CUSTOMER_FOOTER";

const MASTER_VERSION =
  "2026.08.27.4";


/* =========================================================
   MASTER CONFIG
========================================================= */

const MASTER_CONFIG = {

  version: MASTER_VERSION,

  brand: {

    groupName: "SKANDI Group",
    travelName: "SKANDI Travels",

    slogans: {
      en: "Unforgettable Moments",
      sv: "När du längtar bort",
      no: "Når du lengter bort",
      da: "Når du længes væk",
      fi: "Kun kaipaat pois"
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
          "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",

        skandiPrimary:
          "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",

        skandiTravels:
          "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png"
      }

    }

  },


  routes: {

    home: "/",

    search: "/search",

    flights: "/flights",

    hotels: "/hotels",

    packages: "/packages",

    tours: "/tours",

    activities: "/activities",

    transfers: "/transfers",

    carRental: "/car-rental",

    destinations: "/destinations",

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

      ],


      secondaryNav: [

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

      ],


      accountNav: [

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
          title: "BOOK & TRAVEL",

          links: [

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
            }

          ]
        },


        {
          title: "HELP & TRAVEL INFO",

          links: [

            {
              label: "Before you travel",
              path: "/travel-info"
            },

            {
              label: "Passport & Visa",
              path: "/travel-info/passport-visa"
            },

            {
              label: "Baggage Allowance",
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

          ]
        },


        {
          title: "SKANDI",

          links: [

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

          ]
        },


        {
          title: "ABOUT SKANDI",

          links: [

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

          ]
        }

      ],


      bottomLinks: [

        {
          label: "Legal",
          path: "/about/legal"
        },

        {
          label: "Privacy",
          path: "/about/legal/policies?policy=privacy"
        },

        {
          label: "Terms",
          path: "/about/legal/policies?policy=terms"
        },

        {
          label: "Accessibility",
          path: "/about/legal/policies?policy=accessibility"
        }

      ],


      staffLogin: {
        label: "Staff Login",
        path: "/riaintra"
      }

    }

  }

};


/* =========================================================
   PATH
========================================================= */

function currentPath() {

  try {

    const path =
      wixLocationFrontend.path || [];

    return "/" + path.join("/");

  } catch (_) {

    return "/";

  }

}


function isInternalPath() {

  const path =
    currentPath().toLowerCase();

  return (
    path === "/riaintra" ||
    path.startsWith("/riaintra/") ||
    path === "/altea" ||
    path.startsWith("/altea/")
  );

}


/* =========================================================
   MESSAGE UTILITIES
========================================================= */

function parseMessage(data) {

  if (
    typeof data === "string"
  ) {

    try {

      return JSON.parse(data);

    } catch (_) {

      return null;

    }

  }

  if (
    data &&
    typeof data === "object"
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
    typeof embed.postMessage !== "function"
  ) {

    return;

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

  } catch (error) {

    console.error(
      "[SKANDI MASTER] postMessage failed",
      embed?.id,
      error
    );

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
    embed?.id || "unknown"
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


    const displayName =

      member?.profile?.nickname ||

      member?.profile?.firstName ||

      member?.contactDetails?.firstName ||

      member?.loginEmail ||

      "Member";


    return {

      loggedIn: true,

      displayName,

      points: 0,

      tierName: "",

      menu: []

    };


  } catch (error) {

    console.warn(
      "[SKANDI MASTER] Member state unavailable",
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
   NAVIGATION
========================================================= */

function navigate(
  rawPath
) {

  const path =
    String(
      rawPath || ""
    ).trim();


  if (!path) {
    return;
  }


  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    /^(javascript|data|vbscript):/i.test(path)
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


  wixLocationFrontend.to(path);

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
      typeof embed.expand === "function"
    ) {

      await embed.expand();

    }

  } catch (_) {}


  try {

    if (
      typeof embed.show === "function"
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
      typeof embed.hide === "function"
    ) {

      await embed.hide();

    }

  } catch (_) {}


  try {

    if (
      typeof embed.collapse === "function"
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
    source !== HEADER_SOURCE &&
    source !== FOOTER_SOURCE
  ) {

    return;
  }


  if (
    isInternalPath()
  ) {

    await hideEmbed(embed);

  } else {

    await showEmbed(embed);

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

    ).trim();


  if (!query) {

    navigate("/search");

    return;

  }


  navigate(
    `/search?q=${encodeURIComponent(query)}`
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
      message.source || ""
    );


  const type =
    String(
      message.type || ""
    );


  const payload =
    message.payload &&
    typeof message.payload === "object"

      ? message.payload

      : {};


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
     GENERIC MASTER REQUEST
  ------------------------------------------------------- */

  if (
    type === "MASTER_CONFIG_REQUEST" ||
    type === "SKANDI_MASTER_CONFIG_REQUEST"
  ) {

    sendMasterConfig(embed);


    if (
      source === HEADER_SOURCE
    ) {

      await sendHeaderState(
        embed
      );

    }


    if (
      source === FOOTER_SOURCE
    ) {

      post(
        embed,
        "CUSTOMER_FOOTER_STATE",
        {
          ready: true
        }
      );

    }


    return;

  }


  /* -------------------------------------------------------
     HEADER READY
  ------------------------------------------------------- */

  if (
    source === HEADER_SOURCE &&
    type === "HEADER_READY"
  ) {

    sendMasterConfig(embed);

    await sendHeaderState(
      embed
    );

    return;

  }


  /* -------------------------------------------------------
     FOOTER READY
  ------------------------------------------------------- */

  if (
    source === FOOTER_SOURCE &&
    type === "FOOTER_READY"
  ) {

    sendMasterConfig(embed);

    post(
      embed,
      "CUSTOMER_FOOTER_STATE",
      {
        ready: true
      }
    );

    return;

  }


  /* -------------------------------------------------------
     HEADER NAVIGATION
  ------------------------------------------------------- */

  if (
    source === HEADER_SOURCE &&
    type === "HEADER_NAVIGATE"
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
    source === HEADER_SOURCE &&
    type === "HEADER_SEARCH"
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
    source === HEADER_SOURCE &&
    type === "HEADER_LOGIN"
  ) {

    try {

      await authentication.promptLogin();

    } catch (_) {}


    await sendHeaderState(
      embed
    );

    return;

  }


  if (
    source === HEADER_SOURCE &&
    type === "HEADER_LOGIN_SUBMIT"
  ) {

    const email =
      String(
        payload.email ||
        message.email ||
        ""
      ).trim();


    const password =
      String(
        payload.password ||
        message.password ||
        ""
      );


    try {

      await authentication.login(
        email,
        password
      );


      await sendHeaderState(
        embed
      );


    } catch (_) {

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
    source === HEADER_SOURCE &&
    type === "HEADER_FORGOT_PASSWORD"
  ) {

    try {

      await authentication
        .promptForgotPassword();

    } catch (_) {}


    return;

  }


  if (
    source === HEADER_SOURCE &&
    type === "HEADER_LOGOUT"
  ) {

    try {

      await authentication.logout();

    } catch (_) {}


    await sendHeaderState(
      embed
    );


    navigate("/");

    return;

  }


  /* -------------------------------------------------------
     HEADER HEIGHT
  ------------------------------------------------------- */

  if (
    source === HEADER_SOURCE &&
    type === "SKANDI_EMBED_RESIZE"
  ) {

    const requested =
      Number(
        payload.height
      );


    if (
      Number.isFinite(requested)
    ) {

      try {

        embed.height =
          Math.max(
            118,
            Math.min(
              1200,
              Math.round(requested)
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
    source === FOOTER_SOURCE &&
    type === "FOOTER_NAVIGATE"
  ) {

    navigate(
      payload.path ||
      message.path
    );

    return;

  }


  if (
    source === FOOTER_SOURCE &&
    type === "FOOTER_STAFF_LOGIN"
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
    type === "MASTER_NAVIGATE"
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

const wiredEmbeds =
  new WeakSet();


function wireEmbed(
  embed
) {

  if (
    !embed ||
    wiredEmbeds.has(embed) ||
    typeof embed.onMessage !== "function"
  ) {

    return;

  }


  wiredEmbeds.add(embed);


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
   READY
========================================================= */

$w.onReady(
  async function () {

    console.log(
      "[SKANDI MASTER] READY",
      MASTER_VERSION,
      currentPath()
    );


    let components = [];


    try {

      components =
        $w("HtmlComponent") || [];

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
     * Retry the wiring because global/page HTML elements
     * can finish initialization slightly after masterPage ready.
     */
    setTimeout(
      () => {

        try {

          const later =
            $w("HtmlComponent") || [];


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

          const embeds =
            $w("HtmlComponent") || [];


          for (
            const embed of embeds
          ) {

            await sendHeaderState(
              embed
            );

          }

        } catch (_) {}

      }
    );

  }
);
