// pages/successfactors-profile-sync.js
//
// Page URL: /riaintra/success-factors
// HTML Embed ID: #staffHrEmbed
//
// This file adds the shared RIAINTRA/Supabase profile contract used by the
// existing SuccessFactors HTML. The HTML already sends INTRANET_READY,
// INTRANET_REFRESH, INTRANET_SAVE_PROFILE and INTRANET_SEARCH_COLLEAGUES.

import wixLocation from "wix-location";

import {
  authentication
} from "wix-members-frontend";

import {
  getStaffPortalSession
} from "backend/RIA/staffPortalAuth.web";

import {
  getIntranetHomeData
} from "backend/RIA/staffIntranet.web";

import {
  getMyStaffProfile,
  updateMyStaffProfile,
  searchStaffDirectory
} from "backend/RIA/staffProfile.web";


const EMBED_ID =
  "#staffDashboardEmbed";

const CHILD_SOURCES =
  new Set([
    "SKANDI_HR_STAFF",

    /*
     * Compatibility for older SuccessFactors builds that shared the
     * Staff Dashboard source.
     */
    "SKANDI_STAFF_DASHBOARD_INTRANET"
  ]);

const PARENT_SOURCE =
  "SKANDI_WIX_PARENT";

const STAFF_LOGIN_PATH =
  "/riaintra";

const HOME_PATH =
  "/";

const ALLOWED_PATH_PREFIXES = [
  "/riaintra",
  "/altea"
];

let html =
  null;

let bootstrapPromise =
  null;


/* ==========================================================================
   BRIDGE
   ========================================================================== */

function post(
  type,
  payload = {}
) {
  if (!html) {
    return;
  }

  html.postMessage({
    source:
      PARENT_SOURCE,

    type,

    payload,

    timestamp:
      new Date()
        .toISOString()
  });
}


function cleanError(
  error
) {
  const raw =
    String(
      error?.message ||
      error ||
      ""
    ).trim();

  const map = {
    STAFF_PROFILE_AUTH_REQUIRED:
      "Your session has expired. Sign in again.",

    STAFF_PROFILE_NOT_FOUND:
      "Your SuccessFactors employee profile could not be found.",

    STAFF_PROFILE_AGENT_ID_MISSING:
      "Your employee profile is not linked correctly."
  };

  return (
    map[raw] ||
    (
      raw.length <=
      220
        ? raw
        : ""
    ) ||
    "SuccessFactors could not complete the action."
  );
}


/* ==========================================================================
   BOOTSTRAP
   ========================================================================== */

async function bootstrap(
  force = false
) {
  if (
    bootstrapPromise &&
    !force
  ) {
    return bootstrapPromise;
  }

  bootstrapPromise =
    (async () => {
      const session =
        await getStaffPortalSession();

      if (
        !session.loggedIn ||
        !session.authorized
      ) {
        post(
          "INTRANET_SESSION_EXPIRED",
          {
            message:
              "Your RIAINTRA session is not authorized."
          }
        );

        wixLocation.to(
          STAFF_LOGIN_PATH
        );

        return null;
      }

      const [
        profileResult,
        intranet
      ] =
        await Promise.all([
          getMyStaffProfile(),

          getIntranetHomeData()
            .catch(
              () => ({
                news:
                  [],
                stats:
                  {}
              })
            )
        ]);

      /*
       * One authoritative profile:
       * Supabase agent_users + staff_payroll_profiles.
       */
      const profile =
        profileResult.profile ||
        session.profile ||
        session.staff ||
        {};

      const payload = {
        profile,

        apps:
          intranet.apps ||
          session.apps ||
          [],

        news:
          intranet.news ||
          [],

        stats:
          intranet.stats ||
          {},

        /*
         * SuccessFactors' normalizePayroll() accepts these aliases.
         * Sensitive raw bank values are intentionally not returned.
         */
        payrollProfile: {
          bankStatus:
            profile.paymentSetupStatus ||
            ""
        },

        paymentPreference: {
          bankName:
            profile.bankName ||
            "",

          bankBicSwift:
            profile.bankBicSwift ||
            "",

          usAccountType:
            profile.usAccountType ||
            "",

          bankIban:
            "",

          bankClearingNumber:
            "",

          bankAccountNumber:
            "",

          usRoutingNumber:
            "",

          usAccountNumber:
            ""
        }
      };

      post(
        "INTRANET_BOOTSTRAP",
        payload
      );

      return payload;
    })();

  try {
    return await bootstrapPromise;
  } finally {
    bootstrapPromise =
      null;
  }
}


/* ==========================================================================
   PROFILE ACTIONS
   ========================================================================== */

async function saveProfile(
  payload = {}
) {
  const result =
    await updateMyStaffProfile({
      profile:
        payload.profile ||
        {}
    });

  /*
   * Existing SuccessFactors HTML listens for this and requests refresh.
   */
  post(
    "INTRANET_PROFILE_SAVED",
    result
  );

  /*
   * Send the new profile immediately as well so header/profile cards and
   * Staff Portal semantics all match without waiting for another navigation.
   */
  await bootstrap(
    true
  );
}


async function searchColleagues(
  payload = {}
) {
  const result =
    await searchStaffDirectory({
      query:
        payload.query ||
        ""
    });

  post(
    "INTRANET_COLLEAGUES",
    result
  );
}


/* ==========================================================================
   NAVIGATION
   ========================================================================== */

function openStaffPath(
  path
) {
  const value =
    String(
      path ||
      ""
    ).trim();

  if (!value) {
    throw new Error(
      "Missing staff destination."
    );
  }

  const allowed =
    ALLOWED_PATH_PREFIXES.some(
      (prefix) =>
        value ===
          prefix ||
        value.startsWith(
          `${prefix}/`
        )
    );

  if (!allowed) {
    throw new Error(
      "Invalid staff destination."
    );
  }

  wixLocation.to(
    value
  );
}


async function signOut() {
  await authentication.logout();

  post(
    "INTRANET_SIGNED_OUT",
    {
      message:
        "You have signed out."
    }
  );

  wixLocation.to(
    HOME_PATH
  );
}


/* ==========================================================================
   MESSAGE HANDLER
   ========================================================================== */

async function handleMessage(
  message
) {
  const payload =
    message.payload ||
    {};

  switch (
    message.type
  ) {
    case "INTRANET_READY":
    case "INTRANET_REFRESH":

      await bootstrap(
        message.type ===
        "INTRANET_REFRESH"
      );

      return true;


    case "INTRANET_SAVE_PROFILE":

      await saveProfile(
        payload
      );

      return true;


    case "INTRANET_SEARCH_COLLEAGUES":

      await searchColleagues(
        payload
      );

      return true;


    case "INTRANET_NAVIGATE":

      openStaffPath(
        payload.path
      );

      return true;


    case "STAFF_SIGNOUT_REQUEST":
    case "INTRANET_SIGNOUT":

      await signOut();

      return true;


    default:

      /*
       * IMPORTANT:
       * Return false for HR_*, CAREERS_*, PAYROLL_* and Crewcontrol/Badge
       * events. Keep those branches in your existing SuccessFactors page
       * code unchanged.
       */
      return false;
  }
}


/* ==========================================================================
   INIT
   ========================================================================== */

$w.onReady(function () {
  html =
    $w(
      EMBED_ID
    );

  html.onMessage(
    async (event) => {
      const message =
        event?.data ||
        {};

      if (
        !CHILD_SOURCES.has(
          message.source
        )
      ) {
        return;
      }

      try {
        await handleMessage(
          message
        );
      } catch (error) {
        console.error(
          `[SuccessFactors Profile] ${message.type || "UNKNOWN"} failed.`,
          error
        );

        post(
          "INTRANET_ERROR",
          {
            message:
              cleanError(
                error
              )
          }
        );
      }
    }
  );

  /*
   * The HTML also sends INTRANET_READY itself. Preloading here means the
   * profile is available even if its first ready event is missed.
   */
  void bootstrap()
    .catch(
      (error) => {
        console.error(
          "[SuccessFactors Profile] Initial bootstrap failed.",
          error
        );
      }
    );
});
