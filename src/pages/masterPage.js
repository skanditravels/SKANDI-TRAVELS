// masterPage.js
// SKANDI GLOBAL MASTER CONTROLLER
//
// GLOBAL CHROME ARCHITECTURE
// ------------------------------------------------------------
// 1. SKANDI Travels Header
// 2. SKANDI Travels Footer
// 3. RIAINTRA Header
// 4. RIAINTRA Footer
// 5. ALTEA Header
//
// Internal staff identity and access:
// Supabase public.agent_users
//        ↓
// backend/RIA/staffPortalAuth.web.js
//        ↓
// getStaffPortalSession()
//        ↓
// masterPage.js
//        ↓
// RIAINTRA / ALTEA global HTML components
// ------------------------------------------------------------

import wixLocationFrontend from "wix-location-frontend";
import wixWindowFrontend from "wix-window-frontend";

import {
  currentMember,
  authentication
} from "wix-members-frontend";

import {
  getStaffPortalSession
} from "backend/RIA/staffPortalAuth.web";


// ============================================================
// SOURCES
// ============================================================

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

const ALTEA_HEADER_SOURCE =
  "SKANDI_ALTEA_HEADER";


// ============================================================
// MASTER VERSION
// ============================================================

const MASTER_VERSION =
  "2026.09.08.1";


// ============================================================
// SETTINGS
// ============================================================

const SETTINGS_LIGHTBOX_NAME =
  "SKANDI Language & Currency";

const ALLOWED_LANGUAGES =
  new Set([
    "EN",
    "SV",
    "NO",
    "DA",
    "FI"
  ]);

const ALLOWED_CURRENCIES =
  new Set([
    "USD",
    "SEK",
    "NOK",
    "DKK",
    "EUR"
  ]);


// ============================================================
// REGISTERED HTML COMPONENTS
// ============================================================

const wiredEmbeds =
  new WeakSet();

const customerHeaderEmbeds =
  new Set();

const customerFooterEmbeds =
  new Set();

const riaintraHeaderEmbeds =
  new Set();

const riaintraFooterEmbeds =
  new Set();

const alteaHeaderEmbeds =
  new Set();


// ============================================================
// CACHED STATE
// ============================================================

let settingsPopupPromise = null;

let staffStatePromise = null;


// ============================================================
// MASTER CONFIG
// ============================================================

const MASTER_CONFIG = {

  version:
    MASTER_VERSION,


  // ----------------------------------------------------------
  // BRAND
  // ----------------------------------------------------------

  brand: {

    groupName:
      "SKANDI Group",

    travelName:
      "SKANDI TRAVELS",

    slogans: {

      en:
        "https://static.wixstatic.com/media/394052_6d5f53cf8c2d4abdac6578b12fe2758c~mv2.png",

      sv:
        "https://static.wixstatic.com/media/394052_370c093c663e45cb999378aaf642b7ef~mv2.png",

      no:
        "Når du lengter bort",

      da:
        "Når du længes væk",

      fi:
        "Kun kaipaat pois",

      altea:
        'WE MAKE DOOR TO DOOR <span>STAY IN SYNC</span>'
    },


    languages: [
      "EN",
      "SV",
      "NO",
      "DA",
      "FI"
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
          "https://static.wixstatic.com/media/394052_46045c41aebf421d98314b31ef83c677~mv2.png",

        skandiTravels:
          "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png",

        riaintra:
          "https://static.wixstatic.com/media/394052_635532ed8a8d446ab22f4fc09ef65858~mv2.png",

        riaintraLight:
          "https://static.wixstatic.com/media/394052_635532ed8a8d446ab22f4fc09ef65858~mv2.png"
      }
    }
  },


  // ----------------------------------------------------------
  // GLOBAL ROUTES
  // ----------------------------------------------------------

  routes: {

    home:
      "/",

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
      "/our-destinations",

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

    careers:
      "/about/careers",

    // --------------------------------------------------------
    // RIAINTRA
    // --------------------------------------------------------

    riaintra:
      "/riaintra",

    riaintraHome:
      "/riaintra/success-factors",

    successFactors:
      "/riaintra/success-factors",

    mail:
      "/riaintra/success-factors/mail",

    myPayroll:
      "/riaintra/success-factors/my-payroll",

    docunet:
      "/riaintra/success-factors/docunet",

    uniform:
      "/riaintra/success-factors/uniform",

    serviceDesk:
      "/riaintra/success-factors/helpdesk",


    // --------------------------------------------------------
    // ALTEA
    // --------------------------------------------------------

    altea:
      "/riaintra/success-factors/altea",

    alteaReservations:
      "/riaintra/success-factors/altea/reservations",

    alteaGroupTalk:
      "/riaintra/success-factors/altea/grouptalk",


    // --------------------------------------------------------
    // COMPATIBILITY FOR CURRENT ALTEA HEADER
    //
    // Your current ALTEA HTML uses:
    //
    // data-route="/riaintra/success-factors"
    //
    // and then looks it up inside config.routes.
    //
    // This key therefore intentionally exists.
    // --------------------------------------------------------

    "/riaintra/success-factors":
      "/riaintra/success-factors"
  },


  // ----------------------------------------------------------
  // CUSTOMER CHROME
  // ----------------------------------------------------------

  customer: {

    header: {

      primaryNav: [
        {
          id: "home",
          label: "Book",
          path: "/"
        },
        {
          id: "destinations",
          label: "Destinations",
          path: "/our-destinations"
        },
        {
          id: "tours",
          label: "Tours & Activities",
          path: "/tours"
        },
        {
          id: "travelInfo",
          label: "Travel Info",
          path: "/travel-info"
        },
        {
          id: "signature",
          label: "SKANDI Collection",
          path: "/skandi-collection"
        }
      ],


      accountNav: [
        {
          id: "home",
          label: "Book",
          path: "/"
        },
        {
          id: "destinations",
          label: "Destinations",
          path: "/our-destinations"
        },
        {
          id: "tours",
          label: "Tours & Activities",
          path: "/tours"
        },
        {
          id: "travelInfo",
          label: "Travel Info",
          path: "/travel-info"
        },
        {
          id: "signature",
          label: "SKANDI Collection",
          path: "/skandi-collection"
        },
        {
          id: "myTrip",
          label: "My Trips",
          path: "/my-profile?tab=trips"
        }
      ]
    },


    footer: {

      newsletter: {

        title:
          "Get SKANDI offers and travel inspiration",

        description:
          "Receive destination guides, SKANDI Collection updates and member offers.",

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
              label: "Book a trip",
              path: "/"
            },

            {
              label: "Manage your booking",
              path: "/my-profile?tab=trips"
            },

            {
              label: "Our Destinations",
              path: "/our-destinations"
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

          title:
            "HELP & TRAVEL INFO",

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

          title:
            "SKANDI",

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

          title:
            "ABOUT SKANDI",

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
          label: "Cookies",
          path: "/about/legal/policies?policy=cookies"
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
        },

        {
          label: "Staff Login",
          path: "/riaintra"
        }
      ]
    }
  },


  // ----------------------------------------------------------
  // INTERNAL CHROME
  // ----------------------------------------------------------

  internal: {

    header: {

      contexts: {


        // ====================================================
        // RIAINTRA HEADER
        // ====================================================

        riaintra: {

          productName:
            "SKANDI TRAVELS",

          productContext:
            "RIAINTRA Enterprise Workforce Suite",

          logoKey:
            "riaintraLight",

          primaryNav: [

            {
              id: "home",
              label: "Home",
              path: "/riaintra/success-factors"
            },

            {
              id: "altea",
              label: "ALTEA",
              path: "/riaintra/success-factors/altea"
            },

            {
              id: "mail",
              label: "Mail",
              path: "/riaintra/success-factors/mail"
            },

            {
              id: "payroll",
              label: "MyPayroll",
              path: "/riaintra/success-factors/my-payroll"
            },

            {
              id: "docunet",
              label: "DocuNet",
              path: "/riaintra/success-factors/docunet"
            },

            {
              id: "uniform",
              label: "Uniform Center",
              path: "/riaintra/success-factors/uniform"
            },

            {
              id: "helpdesk",
              label: "HelpDesk",
              path: "/riaintra/success-factors/helpdesk"
            }
          ]
        },


        // ====================================================
        // ALTEA HEADER
        // ====================================================

        altea: {

          productName:
            "ALTEA",

          productContext:
            "SKANDI Operations",

          logoKey:
            "skandiPrimary",

          primaryNav: [

            {
              id: "success-factors",
              label: "Success Factors",
              path: "/riaintra/success-factors"
            },

            {
              id: "altea",
              label: "ALTEA Launchpad",
              path: "/riaintra/success-factors/altea"
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
          ]
        }
      }
    }
  }
};


// ============================================================
// PATH HELPERS
// ============================================================

function currentPath() {

  try {

    return (
      "/" +
      (
        wixLocationFrontend.path ||
        []
      ).join("/")
    );

  } catch (_) {

    return "/";
  }
}


function normalizePath(
  value = ""
) {

  let path =
    String(
      value ||
      "/"
    ).trim();

  if (!path) {

    return "/";
  }

  if (
    path.length > 1
  ) {

    path =
      path.replace(
        /\/+$/,
        ""
      );
  }

  return path;
}


function isInternalPath(
  path = currentPath()
) {

  const value =
    normalizePath(path)
      .toLowerCase();

  return (

    value ===
      "/riaintra" ||

    value.startsWith(
      "/riaintra/"
    ) ||

    value ===
      "/altea" ||

    value.startsWith(
      "/altea/"
    )
  );
}


function isStaffLoginPath(
  path = currentPath()
) {

  return (
    normalizePath(path)
      .toLowerCase() ===
    "/riaintra"
  );
}


function isAlteaPath(
  path = currentPath()
) {

  const value =
    normalizePath(path)
      .toLowerCase();

  return (

    value ===
      "/altea" ||

    value.startsWith(
      "/altea/"
    ) ||

    value ===
      "/riaintra/success-factors/altea" ||

    value.startsWith(
      "/riaintra/success-factors/altea/"
    )
  );
}


function isRiaintraWorkspacePath(
  path = currentPath()
) {

  return (

    isInternalPath(path) &&

    !isStaffLoginPath(path) &&

    !isAlteaPath(path)
  );
}


// ============================================================
// MESSAGE HELPERS
// ============================================================

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


// ============================================================
// STAFF / AGENT_USERS
// ============================================================

function normalizeAgentProfile(
  profile = {}
) {

  if (
    !profile ||
    typeof profile !==
      "object"
  ) {

    return null;
  }

  const firstName =
    profile.firstName ||
    profile.first_name ||
    "";

  const lastName =
    profile.lastName ||
    profile.last_name ||
    "";

  return {

    id:
      profile.id ||
      "",

    agentId:
      profile.agentId ||
      profile.agent_id ||
      "",

    skId:
      profile.skId ||
      profile.sk_id ||
      "",

    firstName,

    lastName,

    preferredName:
      profile.preferredName ||
      profile.preferred_name ||
      "",

    displayName:

      profile.displayName ||

      profile.display_name ||

      profile.name ||

      [
        firstName,
        lastName
      ]
        .filter(Boolean)
        .join(" ") ||

      "Staff",

    jobTitle:
      profile.jobTitle ||
      profile.job_title ||
      "",

    department:
      profile.department ||
      "",

    station:
      profile.station ||
      profile.base ||
      "",

    base:
      profile.base ||
      profile.station ||
      "",

    email:
      profile.email ||
      "",

    corporateEmailAddress:
      profile.corporateEmailAddress ||
      profile.corporate_email_address ||
      "",

    badgePhotoUrl:
      profile.badgePhotoUrl ||
      profile.badge_photo_url ||
      "",

    employmentStatus:
      profile.employmentStatus ||
      profile.employment_status ||
      "",

    status:
      profile.status ||
      "",

    active:
      profile.active ===
      true,

    portalAccess:

      profile.portalAccess ===
        true ||

      profile.portal_access ===
        true,

    authorized:
      profile.authorized ===
      true,

    canManage:

      profile.canManage ===
        true ||

      profile.can_manage ===
        true,

    permissions:

      profile.permissions &&
      typeof profile.permissions ===
        "object"

        ? profile.permissions

        : {}
  };
}


function emptyStaffState(
  code = ""
) {

  return {

    loggedIn:
      false,

    authenticated:
      false,

    authorized:
      false,

    profile:
      null,

    apps:
      [],

    permissions:
      {},

    code
  };
}


async function getInternalState(
  force = false
) {

  if (
    !isInternalPath()
  ) {

    return emptyStaffState(
      "NOT_INTERNAL"
    );
  }


  if (
    !staffStatePromise ||
    force
  ) {

    staffStatePromise =
      getStaffPortalSession()

        .then(
          session => {

            const rawProfile =

              session?.profile ||

              session?.staff ||

              session?.agent ||

              null;


            const profile =
              normalizeAgentProfile(
                rawProfile
              );


            return {

              loggedIn:

                session?.loggedIn ===
                  true ||

                session?.authenticated ===
                  true,


              authenticated:

                session?.authenticated ===
                  true ||

                session?.loggedIn ===
                  true,


              authorized:

                session?.authorized ===
                  true &&

                profile?.authorized ===
                  true,


              profile,


              apps:

                Array.isArray(
                  session?.apps
                )

                  ? session.apps

                  : [],


              permissions:

                session?.permissions &&
                typeof session.permissions ===
                  "object"

                  ? session.permissions

                  : (
                    profile?.permissions ||
                    {}
                  ),


              checkedAt:

                session?.checkedAt ||

                new Date()
                  .toISOString(),


              code:
                session?.code ||
                ""
            };
          }
        )

        .catch(
          error => {

            console.warn(
              "[SKANDI MASTER] agent_users session unavailable",
              error
            );

            return (
              emptyStaffState(
                "STAFF_STATE_FAILED"
              )
            );
          }
        )

        .finally(
          () => {

            setTimeout(
              () => {

                staffStatePromise =
                  null;

              },
              250
            );
          }
        );
  }


  return staffStatePromise;
}


// ============================================================
// INTERNAL ACCESS CONTROL
// ============================================================

function appAllowsPath(
  app,
  targetPath
) {

  const appPath =
    normalizePath(
      app?.path ||
      ""
    );

  const target =
    normalizePath(
      targetPath ||
      ""
    );


  if (
    !appPath ||
    !target
  ) {

    return false;
  }


  return (

    target ===
      appPath ||

    target.startsWith(
      `${appPath}/`
    ) ||

    appPath.startsWith(
      `${target}/`
    )
  );
}


function canOpenInternalPath(
  state,
  targetPath
) {

  if (
    state?.authorized !==
    true
  ) {

    return false;
  }


  if (
    state?.profile?.canManage ===
    true
  ) {

    return true;
  }


  const apps =
    Array.isArray(
      state?.apps
    )

      ? state.apps

      : [];


  return apps.some(
    app =>
      appAllowsPath(
        app,
        targetPath
      )
  );
}


// ============================================================
// SOURCE CONTEXT
// ============================================================

function internalContextForSource(
  source
) {

  if (
    source ===
    ALTEA_HEADER_SOURCE
  ) {

    return "altea";
  }


  return "riaintra";
}


// ============================================================
// INTERNAL HEADER CONFIG
// ============================================================

function buildInternalHeader(
  source,
  state
) {

  const contextKey =
    internalContextForSource(
      source
    );


  const context =
    MASTER_CONFIG
      .internal
      .header
      .contexts[
        contextKey
      ];


  const primaryNav =
    (
      context.primaryNav ||
      []
    )
      .filter(
        item =>
          canOpenInternalPath(
            state,
            item.path
          )
      );


  return {

    context:
      contextKey,

    productName:
      context.productName,

    productContext:
      context.productContext,

    logoKey:
      context.logoKey,

    primaryNav
  };
}


// ============================================================
// MASTER PAYLOAD
// ============================================================

function masterPayload(
  source = "",
  staffState = null
) {

  const path =
    currentPath();


  const state =
    staffState ||
    emptyStaffState();


  return {

    ...MASTER_CONFIG,


    internal: {

      ...MASTER_CONFIG.internal,

      header:
        buildInternalHeader(
          source,
          state
        )
    },


    currentPath:
      path,


    mode:

      isInternalPath(path)

        ? "internal"

        : "customer",


    isInternal:
      isInternalPath(path),


    isAltea:
      isAlteaPath(path)
  };
}


function sendMasterConfig(
  embed,
  source,
  staffState = null
) {

  post(
    embed,
    "SKANDI_MASTER_CONFIG",
    masterPayload(
      source,
      staffState
    )
  );
}


// ============================================================
// CUSTOMER STATE
// ============================================================

async function getCustomerState() {

  try {

    const member =
      await currentMember
        .getMember();


    if (
      !member
    ) {

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

      member?.profile?.nickname ||

      member?.profile?.firstName ||

      member?.contactDetails?.firstName ||

      member?.loginEmail ||

      "Member";


    return {

      loggedIn:
        true,

      displayName,

      email:
        String(
          member?.loginEmail ||
          ""
        ).trim(),

      points:
        0,

      tierName:
        "",

      menu:
        []
    };

  } catch (error) {

    console.warn(
      "[SKANDI MASTER] customer state unavailable",
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


async function sendCustomerHeaderState(
  embed
) {

  const state =
    await getCustomerState();


  post(
    embed,
    "CUSTOMER_HEADER_STATE",
    state
  );
}


// ============================================================
// INTERNAL STATE DELIVERY
// ============================================================

async function sendInternalState(
  embed,
  source,
  force = false
) {

  const state =
    await getInternalState(
      force
    );


  sendMasterConfig(
    embed,
    source,
    state
  );


  // Common state message
  post(
    embed,
    "INTERNAL_HEADER_STATE",
    state
  );


  // ----------------------------------------------------------
  // CURRENT RIAINTRA HEADER COMPATIBILITY
  // ----------------------------------------------------------

  if (
    source ===
    RIAINTRA_HEADER_SOURCE
  ) {

    post(
      embed,
      "RIAINTRA_HEADER_STATE",
      state
    );
  }


  // ----------------------------------------------------------
  // ALTEA STATE
  //
  // Current ALTEA header only requires SKANDI_MASTER_CONFIG,
  // but this is sent too for future user/station integration.
  // ----------------------------------------------------------

  if (
    source ===
    ALTEA_HEADER_SOURCE
  ) {

    post(
      embed,
      "ALTEA_HEADER_STATE",
      state
    );
  }
}


// ============================================================
// LANGUAGE / CURRENCY
// ============================================================

function normalizeLanguage(
  value
) {

  const normalized =
    String(
      value ||
      "EN"
    )
      .trim()
      .toUpperCase();


  return (
    ALLOWED_LANGUAGES.has(
      normalized
    )

      ? normalized

      : "EN"
  );
}


function normalizeCurrency(
  value
) {

  const normalized =
    String(
      value ||
      "USD"
    )
      .trim()
      .toUpperCase();


  return (
    ALLOWED_CURRENCIES.has(
      normalized
    )

      ? normalized

      : "USD"
  );
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
    of customerHeaderEmbeds
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

    customerHeaderEmbeds
      .add(
        requestingEmbed
      );
  }


  if (
    settingsPopupPromise
  ) {

    return (
      settingsPopupPromise
    );
  }


  const defaults =
    normalizeSettings(
      payload
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
            !ALLOWED_LANGUAGES.has(
              language
            ) ||

            !ALLOWED_CURRENCIES.has(
              currency
            )
          ) {

            return null;
          }


          const settings = {

            language,

            currency
          };


          sendSettingsToHeaders(
            settings
          );


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
            "[SKANDI MASTER] settings popup failed",
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


  return (
    settingsPopupPromise
  );
}


// ============================================================
// NAVIGATION
// ============================================================

function navigate(
  rawPath,
  internalOnly = false
) {

  const path =
    String(
      rawPath ||
      ""
    ).trim();


  if (
    !path ||

    !path.startsWith(
      "/"
    ) ||

    path.startsWith(
      "//"
    ) ||

    /^(javascript|data|vbscript):/i
      .test(
        path
      )
  ) {

    return;
  }


  if (
    internalOnly &&
    !isInternalPath(
      path
    )
  ) {

    console.warn(
      "[SKANDI MASTER] blocked external navigation from internal chrome",
      path
    );

    return;
  }


  wixLocationFrontend
    .to(
      path
    );
}


// ============================================================
// SHOW / HIDE
// ============================================================

async function showEmbed(
  embed
) {

  if (
    !embed
  ) {

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

  if (
    !embed
  ) {

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


// ============================================================
// SOURCE REGISTRATION
// ============================================================

function registerSource(
  embed,
  source
) {

  switch (
    source
  ) {

    case CUSTOMER_HEADER_SOURCE:

      customerHeaderEmbeds
        .add(
          embed
        );

      break;


    case CUSTOMER_FOOTER_SOURCE:

      customerFooterEmbeds
        .add(
          embed
        );

      break;


    case RIAINTRA_HEADER_SOURCE:

      riaintraHeaderEmbeds
        .add(
          embed
        );

      break;


    case RIAINTRA_FOOTER_SOURCE:

      riaintraFooterEmbeds
        .add(
          embed
        );

      break;


    case ALTEA_HEADER_SOURCE:

      alteaHeaderEmbeds
        .add(
          embed
        );

      break;
  }
}


// ============================================================
// CHROME VISIBILITY
// ============================================================

async function syncChromeVisibility(
  embed,
  source
) {

  const path =
    currentPath();


  // ----------------------------------------------------------
  // CUSTOMER
  // ----------------------------------------------------------

  if (
    source ===
      CUSTOMER_HEADER_SOURCE ||

    source ===
      CUSTOMER_FOOTER_SOURCE
  ) {

    if (
      isInternalPath(
        path
      )
    ) {

      await hideEmbed(
        embed
      );

    } else {

      await showEmbed(
        embed
      );
    }

    return;
  }


  // ----------------------------------------------------------
  // RIAINTRA HEADER + FOOTER
  // ----------------------------------------------------------

  if (
    source ===
      RIAINTRA_HEADER_SOURCE ||

    source ===
      RIAINTRA_FOOTER_SOURCE
  ) {

    if (
      isRiaintraWorkspacePath(
        path
      )
    ) {

      await showEmbed(
        embed
      );

    } else {

      await hideEmbed(
        embed
      );
    }

    return;
  }


  // ----------------------------------------------------------
  // ALTEA HEADER
  // ----------------------------------------------------------

  if (
    source ===
      ALTEA_HEADER_SOURCE
  ) {

    if (
      isAlteaPath(
        path
      )
    ) {

      await showEmbed(
        embed
      );

    } else {

      await hideEmbed(
        embed
      );
    }
  }
}


// ============================================================
// HTML COMPONENT RESIZE
// ============================================================

async function resizeEmbed(
  embed,
  payload = {}
) {

  const requested =
    Number(
      payload.height
    );


  if (
    !Number.isFinite(
      requested
    )
  ) {

    return;
  }


  try {

    embed.height =
      Math.max(
        48,
        Math.min(
          1200,
          Math.round(
            requested
          )
        )
      );

  } catch (error) {

    console.warn(
      "[SKANDI MASTER] embed resize failed",
      error
    );
  }
}


// ============================================================
// INTERNAL NAVIGATION SECURITY
// ============================================================

async function handleInternalNavigation(
  embed,
  path
) {

  const target =
    String(
      path ||
      ""
    ).trim();


  if (
    !target
  ) {

    return;
  }


  const state =
    await getInternalState();


  if (
    !canOpenInternalPath(
      state,
      target
    )
  ) {

    console.warn(
      "[SKANDI MASTER] agent_users access denied",
      target
    );


    post(
      embed,
      "INTERNAL_HEADER_ERROR",
      {
        code:
          "ACCESS_DENIED"
      }
    );


    return;
  }


  navigate(
    target,
    true
  );
}


// ============================================================
// CUSTOMER SEARCH
// ============================================================

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


  navigate(

    query

      ? `/search?q=${encodeURIComponent(query)}`

      : "/search"
  );
}


// ============================================================
// MAIN MESSAGE HANDLER
// ============================================================

async function handleMessage(
  embed,
  event
) {

  const message =
    parseMessage(
      event?.data
    );


  if (
    !message
  ) {

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


  // ----------------------------------------------------------
  // REGISTER COMPONENT
  // ----------------------------------------------------------

  registerSource(
    embed,
    source
  );


  // ----------------------------------------------------------
  // APPLY VISIBILITY IMMEDIATELY
  // ----------------------------------------------------------

  await syncChromeVisibility(
    embed,
    source
  );


  // ==========================================================
  // MASTER CONFIG REQUEST
  // ==========================================================

  if (
    type ===
      "MASTER_CONFIG_REQUEST" ||

    type ===
      "SKANDI_MASTER_CONFIG_REQUEST"
  ) {


    // --------------------------------------------------------
    // RIAINTRA HEADER
    // --------------------------------------------------------

    if (
      source ===
      RIAINTRA_HEADER_SOURCE
    ) {

      await sendInternalState(
        embed,
        source
      );

      return;
    }


    // --------------------------------------------------------
    // ALTEA HEADER
    // --------------------------------------------------------

    if (
      source ===
      ALTEA_HEADER_SOURCE
    ) {

      await sendInternalState(
        embed,
        source
      );

      return;
    }


    // --------------------------------------------------------
    // RIAINTRA FOOTER
    // --------------------------------------------------------

    if (
      source ===
      RIAINTRA_FOOTER_SOURCE
    ) {

      const state =
        await getInternalState();


      sendMasterConfig(
        embed,
        source,
        state
      );


      post(
        embed,
        "RIAINTRA_FOOTER_STATE",
        state
      );


      return;
    }


    // --------------------------------------------------------
    // CUSTOMER
    // --------------------------------------------------------

    sendMasterConfig(
      embed,
      source
    );


    if (
      source ===
      CUSTOMER_HEADER_SOURCE
    ) {

      await sendCustomerHeaderState(
        embed
      );
    }


    if (
      source ===
      CUSTOMER_FOOTER_SOURCE
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


  // ==========================================================
  // INTERNAL HEADER READY
  // ==========================================================

  if (

    source ===
      RIAINTRA_HEADER_SOURCE ||

    source ===
      ALTEA_HEADER_SOURCE
  ) {

    if (

      type ===
        "INTERNAL_HEADER_READY" ||

      type ===
        "RIAINTRA_HEADER_READY" ||

      type ===
        "ALTEA_HEADER_READY"
    ) {

      await sendInternalState(
        embed,
        source,
        true
      );

      return;
    }
  }


  // ==========================================================
  // INTERNAL NAVIGATION
  // ==========================================================

  if (

    source ===
      RIAINTRA_HEADER_SOURCE ||

    source ===
      ALTEA_HEADER_SOURCE
  ) {

    if (

      type ===
        "INTERNAL_NAVIGATE" ||

      type ===
        "RIAINTRA_NAVIGATE" ||

      type ===
        "ALTEA_NAVIGATE"
    ) {

      await handleInternalNavigation(

        embed,

        payload.path ||
        message.path
      );

      return;
    }


    // --------------------------------------------------------
    // CURRENT ALTEA HEADER USES MASTER_NAVIGATE
    // --------------------------------------------------------

    if (
      type ===
      "MASTER_NAVIGATE"
    ) {

      await handleInternalNavigation(

        embed,

        payload.path ||
        message.path
      );

      return;
    }
  }


  // ==========================================================
  // INTERNAL PROFILE REFRESH
  // ==========================================================

  if (

    source ===
      RIAINTRA_HEADER_SOURCE ||

    source ===
      ALTEA_HEADER_SOURCE
  ) {

    if (

      type ===
        "INTERNAL_PROFILE_REFRESH" ||

      type ===
        "RIAINTRA_PROFILE_REFRESH" ||

      type ===
        "ALTEA_PROFILE_REFRESH"
    ) {

      await sendInternalState(
        embed,
        source,
        true
      );

      return;
    }
  }


  // ==========================================================
  // INTERNAL LOGOUT
  // ==========================================================

  if (

    source ===
      RIAINTRA_HEADER_SOURCE ||

    source ===
      ALTEA_HEADER_SOURCE
  ) {

    if (

      type ===
        "INTERNAL_LOGOUT" ||

      type ===
        "RIAINTRA_LOGOUT" ||

      type ===
        "ALTEA_LOGOUT"
    ) {

      try {

        await authentication
          .logout();

      } catch (_) {}


      navigate(
        "/riaintra"
      );


      return;
    }
  }


  // ==========================================================
  // HTML COMPONENT RESIZE
  //
  // IMPORTANT:
  // Your current RIAINTRA header uses this for mobile menu.
  // ==========================================================

  if (
    type ===
    "SKANDI_EMBED_RESIZE"
  ) {

    if (

      source ===
        CUSTOMER_HEADER_SOURCE ||

      source ===
        RIAINTRA_HEADER_SOURCE ||

      source ===
        ALTEA_HEADER_SOURCE ||

      source ===
        RIAINTRA_FOOTER_SOURCE
    ) {

      await resizeEmbed(
        embed,
        payload
      );


      return;
    }
  }


  // ==========================================================
  // CUSTOMER SETTINGS
  // ==========================================================

  if (

    source ===
      CUSTOMER_HEADER_SOURCE &&

    type ===
      "INITIAL_SETTINGS_REQUIRED"
  ) {

    await openInitialSettingsPopup(
      embed,
      payload
    );

    return;
  }


  // ==========================================================
  // CUSTOMER HEADER READY
  // ==========================================================

  if (

    source ===
      CUSTOMER_HEADER_SOURCE &&

    type ===
      "HEADER_READY"
  ) {

    customerHeaderEmbeds
      .add(
        embed
      );


    sendMasterConfig(
      embed,
      source
    );


    await sendCustomerHeaderState(
      embed
    );


    return;
  }


  // ==========================================================
  // CUSTOMER FOOTER READY
  // ==========================================================

  if (

    source ===
      CUSTOMER_FOOTER_SOURCE &&

    type ===
      "FOOTER_READY"
  ) {

    customerFooterEmbeds
      .add(
        embed
      );


    sendMasterConfig(
      embed,
      source
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


  // ==========================================================
  // CUSTOMER SETTINGS UPDATE
  // ==========================================================

  if (

    source ===
      CUSTOMER_HEADER_SOURCE &&

    type ===
      "UPDATE_SETTINGS"
  ) {

    return;
  }


  // ==========================================================
  // CUSTOMER NAVIGATION
  // ==========================================================

  if (

    source ===
      CUSTOMER_HEADER_SOURCE &&

    type ===
      "HEADER_NAVIGATE"
  ) {

    navigate(
      payload.path ||
      message.path
    );


    return;
  }


  // ==========================================================
  // CUSTOMER SEARCH
  // ==========================================================

  if (

    source ===
      CUSTOMER_HEADER_SOURCE &&

    type ===
      "HEADER_SEARCH"
  ) {

    runSearch(
      message,
      payload
    );


    return;
  }


  // ==========================================================
  // CUSTOMER LOGIN
  // ==========================================================

  if (

    source ===
      CUSTOMER_HEADER_SOURCE &&

    type ===
      "HEADER_LOGIN"
  ) {

    try {

      await authentication
        .promptLogin();

    } catch (_) {}


    await sendCustomerHeaderState(
      embed
    );


    return;
  }


  // ==========================================================
  // CUSTOMER LOGIN SUBMIT
  // ==========================================================

  if (

    source ===
      CUSTOMER_HEADER_SOURCE &&

    type ===
      "HEADER_LOGIN_SUBMIT"
  ) {

    try {

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


      await authentication
        .login(
          email,
          password
        );


      await sendCustomerHeaderState(
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


  // ==========================================================
  // CUSTOMER FORGOT PASSWORD
  // ==========================================================

  if (

    source ===
      CUSTOMER_HEADER_SOURCE &&

    type ===
      "HEADER_FORGOT_PASSWORD"
  ) {

    try {

      await authentication
        .promptForgotPassword();

    } catch (_) {}


    return;
  }


  // ==========================================================
  // CUSTOMER LOGOUT
  // ==========================================================

  if (

    source ===
      CUSTOMER_HEADER_SOURCE &&

    type ===
      "HEADER_LOGOUT"
  ) {

    try {

      await authentication
        .logout();

    } catch (_) {}


    await sendCustomerHeaderState(
      embed
    );


    navigate(
      "/"
    );


    return;
  }


  // ==========================================================
  // CUSTOMER FOOTER NAVIGATION
  // ==========================================================

  if (

    source ===
      CUSTOMER_FOOTER_SOURCE &&

    type ===
      "FOOTER_NAVIGATE"
  ) {

    navigate(
      payload.path ||
      message.path
    );


    return;
  }


  // ==========================================================
  // CUSTOMER FOOTER STAFF LOGIN
  // ==========================================================

  if (

    source ===
      CUSTOMER_FOOTER_SOURCE &&

    type ===
      "FOOTER_STAFF_LOGIN"
  ) {

    navigate(
      "/riaintra"
    );


    return;
  }


  // ==========================================================
  // RIAINTRA FOOTER NAVIGATION
  // ==========================================================

  if (

    source ===
      RIAINTRA_FOOTER_SOURCE
  ) {

    if (

      type ===
        "RIAINTRA_FOOTER_NAVIGATE" ||

      type ===
        "MASTER_NAVIGATE"
    ) {

      await handleInternalNavigation(

        embed,

        payload.path ||
        message.path
      );


      return;
    }
  }


  // ==========================================================
  // GENERIC MASTER NAVIGATION
  // ==========================================================

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


// ============================================================
// WIRE HTML COMPONENT
// ============================================================

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


// ============================================================
// REFRESH CUSTOMER CHROME
// ============================================================

async function refreshCustomerChrome() {

  const state =
    await getCustomerState();


  for (
    const embed
    of customerHeaderEmbeds
  ) {

    post(
      embed,
      "CUSTOMER_HEADER_STATE",
      state
    );
  }
}


// ============================================================
// REFRESH INTERNAL CHROME
// ============================================================

async function refreshInternalChrome(
  force = true
) {

  if (
    !isInternalPath()
  ) {

    return;
  }


  const state =
    await getInternalState(
      force
    );


  // ----------------------------------------------------------
  // RIAINTRA HEADER
  // ----------------------------------------------------------

  for (
    const embed
    of riaintraHeaderEmbeds
  ) {

    sendMasterConfig(
      embed,
      RIAINTRA_HEADER_SOURCE,
      state
    );


    post(
      embed,
      "INTERNAL_HEADER_STATE",
      state
    );


    post(
      embed,
      "RIAINTRA_HEADER_STATE",
      state
    );
  }


  // ----------------------------------------------------------
  // ALTEA HEADER
  // ----------------------------------------------------------

  for (
    const embed
    of alteaHeaderEmbeds
  ) {

    sendMasterConfig(
      embed,
      ALTEA_HEADER_SOURCE,
      state
    );


    post(
      embed,
      "INTERNAL_HEADER_STATE",
      state
    );


    post(
      embed,
      "ALTEA_HEADER_STATE",
      state
    );
  }


  // ----------------------------------------------------------
  // RIAINTRA FOOTER
  // ----------------------------------------------------------

  for (
    const embed
    of riaintraFooterEmbeds
  ) {

    sendMasterConfig(
      embed,
      RIAINTRA_FOOTER_SOURCE,
      state
    );


    post(
      embed,
      "RIAINTRA_FOOTER_STATE",
      state
    );
  }
}


// ============================================================
// SYNC VISIBILITY FOR KNOWN COMPONENTS
// ============================================================

async function syncKnownChromeVisibility() {

  for (
    const embed
    of customerHeaderEmbeds
  ) {

    await syncChromeVisibility(
      embed,
      CUSTOMER_HEADER_SOURCE
    );
  }


  for (
    const embed
    of customerFooterEmbeds
  ) {

    await syncChromeVisibility(
      embed,
      CUSTOMER_FOOTER_SOURCE
    );
  }


  for (
    const embed
    of riaintraHeaderEmbeds
  ) {

    await syncChromeVisibility(
      embed,
      RIAINTRA_HEADER_SOURCE
    );
  }


  for (
    const embed
    of riaintraFooterEmbeds
  ) {

    await syncChromeVisibility(
      embed,
      RIAINTRA_FOOTER_SOURCE
    );
  }


  for (
    const embed
    of alteaHeaderEmbeds
  ) {

    await syncChromeVisibility(
      embed,
      ALTEA_HEADER_SOURCE
    );
  }
}


// ============================================================
// MASTER PAGE READY
// ============================================================

$w.onReady(
  async function () {

    console.log(
      "[SKANDI MASTER] READY",
      MASTER_VERSION,
      currentPath()
    );


    // --------------------------------------------------------
    // FIND EVERY HTML COMPONENT ON MASTER PAGE
    // --------------------------------------------------------

    try {

      const components =
        $w(
          "HtmlComponent"
        ) ||
        [];


      components
        .forEach(
          wireEmbed
        );

    } catch (error) {

      console.error(
        "[SKANDI MASTER] HtmlComponent selector failed",
        error
      );
    }


    // --------------------------------------------------------
    // RETRY WIRING
    // Some global components may initialize slightly later.
    // --------------------------------------------------------

    setTimeout(
      () => {

        try {

          const components =
            $w(
              "HtmlComponent"
            ) ||
            [];


          components
            .forEach(
              wireEmbed
            );

        } catch (error) {

          console.error(
            "[SKANDI MASTER] delayed wiring failed",
            error
          );
        }

      },
      1000
    );


    // --------------------------------------------------------
    // LOGIN EVENT
    // --------------------------------------------------------

    authentication.onLogin(
      async () => {

        try {

          staffStatePromise =
            null;


          await refreshCustomerChrome();


          await refreshInternalChrome(
            true
          );


          await syncKnownChromeVisibility();

        } catch (error) {

          console.warn(
            "[SKANDI MASTER] login refresh failed",
            error
          );
        }
      }
    );
  }
);
