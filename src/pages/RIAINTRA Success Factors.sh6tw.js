// pages/successfactors-profile-sync-v3.js
// Page URL: /riaintra/success-factors
// HTML Embed ID: #staffHrEmbed

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
  "#staffHrEmbed";

const CHILD_SOURCES =
  new Set([
    "SKANDI_STAFF_DASHBOARD_INTRANET",
    "SKANDI_HR_STAFF"
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
      "Your staff session has expired. Sign in again.",

    STAFF_PROFILE_NOT_FOUND:
      "Your SuccessFactors employee profile could not be found in Supabase.",

    STAFF_PROFILE_INACTIVE:
      "Your employee profile is inactive.",

    STAFF_PROFILE_NOT_AUTHORIZED:
      "Your employee profile is not authorized for RIAINTRA.",

    STAFF_PROFILE_PORTAL_DISABLED:
      "Your employee profile does not have portal access.",

    WIX_MEMBER_LINK_MISMATCH:
      "Your Wix member is linked to a different employee profile."
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
   SUCCESSFACTORS ROLE / ACCESS MAPPING
   ========================================================================== */

function successFactorsRole(
  profile = {}
) {
  const roleText =
    String(
      profile.role ||
      profile.position ||
      profile.jobTitle ||
      ""
    )
      .trim()
      .toLowerCase();

  if (
    roleText.includes(
      "driver"
    ) ||
    roleText.includes(
      "blue-collar"
    ) ||
    roleText.includes(
      "blue collar"
    )
  ) {
    return "Driver";
  }

  if (
    roleText.includes(
      "manager"
    ) ||
    roleText.includes(
      "supervisor"
    )
  ) {
    return "Manager";
  }

  if (
    roleText.includes(
      "hr"
    ) ||
    roleText.includes(
      "human resources"
    ) ||
    roleText.includes(
      "admin"
    ) ||
    roleText.includes(
      "founder"
    ) ||
    roleText.includes(
      "ceo"
    ) ||
    roleText.includes(
      "owner"
    ) ||
    profile.permissions?.payroll ===
      true ||
    (
      profile.canManage ===
        true &&
      !roleText
        .includes(
          "manager"
        )
    )
  ) {
    return "HR Admin";
  }

  if (
    profile.canManage ===
    true
  ) {
    return "Manager";
  }

  return "Driver";
}

function successFactorsProfile(
  profile = {}
) {
  const sfRole =
    successFactorsRole(
      profile
    );

  const hrAdmin =
    sfRole ===
    "HR Admin";

  return {
    ...profile,

    systemRole:
      sfRole,

    hrisSystemUserRole:
      sfRole,

    isAdmin:
      hrAdmin,

    isHr:
      hrAdmin,

    isHR:
      hrAdmin,

    isHrAdmin:
      hrAdmin,

    isHRAdmin:
      hrAdmin,

    isPayrollAdmin:
      hrAdmin &&
      profile.permissions?.payroll ===
        true,

    canUseHr:
      hrAdmin,

    canUseHR:
      hrAdmin,

    canManageEmployees:
      hrAdmin,

    hrAccess:
      hrAdmin,

    access: {
      ...(profile.access || {}),
      hr:
        hrAdmin,
      humanResources:
        hrAdmin
    }
  };
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
        !session ||
        session.loggedIn === false ||
        session.authenticated === false ||
        session.authorized !==
          true
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
                apps:
                  session.apps ||
                  [],
                news:
                  [],
                stats:
                  {}
              })
            )
        ]);

      if (
        !profileResult?.ok ||
        !profileResult?.profile
      ) {
        throw new Error(
          "STAFF_PROFILE_NOT_FOUND"
        );
      }

      const profile =
        successFactorsProfile(
          profileResult.profile
        );

      const sfRole =
        successFactorsRole(
          profile
        );

      const payload = {
        profile,

        /*
         * Current SuccessFactors HTML checks this BEFORE inferRole(profile).
         * Supplying it explicitly prevents CEO/Founder/Super Admin roles from
         * being rejected or downgraded by the three-role UI mapper.
         */
        currentUserRole:
          sfRole,

        role:
          sfRole,

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
        },

        sync: {
          source:
            "SUPABASE_AGENT_USERS",

          agentUserId:
            profile.id ||
            "",

          wixMemberId:
            profile.wixMemberId ||
            profile.memberId ||
            "",

          updatedAt:
            profile.updatedAt ||
            ""
        }
      };

      console.log(
        "[SuccessFactors Profile] Bootstrap ready.",
        {
          skId:
            profile.skId ||
            "",
          role:
            profile.role ||
            "",
          successFactorsRole:
            sfRole,
          canManage:
            profile.canManage ===
            true
        }
      );

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
   PROFILE
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

  if (
    !result?.ok
  ) {
    throw new Error(
      result?.message ||
      "PROFILE_SAVE_FAILED"
    );
  }

  post(
    "INTRANET_PROFILE_SAVED",
    result
  );

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
   CURRENT HTML MESSAGE CONTRACT
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
    case "HR_READY":
    case "INTRANET_READY":
    case "INTRANET_REFRESH":

      await bootstrap(
        message.type ===
        "INTRANET_REFRESH"
      );

      return true;


    /*
     * CURRENT SUCCESSFACTORS HTML USES INTRANET_PROFILE_SAVE.
     * Keep the older alias as well so Staff Portal and older builds work.
     */
    case "INTRANET_PROFILE_SAVE":
    case "INTRANET_SAVE_PROFILE":

      await saveProfile(
        payload
      );

      return true;


    case "INTRANET_COLLEAGUES_REQUEST":
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


    /*
     * CURRENT HTML USES INTRANET_SIGN_OUT.
     */
    case "INTRANET_SIGN_OUT":
    case "INTRANET_SIGNOUT":
    case "STAFF_SIGNOUT_REQUEST":

      await signOut();

      return true;


    default:

      /*
       * HR_*, CAREERS_*, PAYROLL_* and Badge/Crewcontrol messages belong to
       * the existing SuccessFactors operational handlers. They are not
       * swallowed by this profile sync bridge.
       */
      return false;
  }
}


/* ==========================================================================
   INIT
   ========================================================================== */

$w.onReady(function () {
  try {
    html =
      $w(
        EMBED_ID
      );
  } catch (error) {
    console.error(
      `[SuccessFactors Profile] Missing HTML Component ${EMBED_ID}.`,
      error
    );

    return;
  }

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
        const handled =
          await handleMessage(
            message
          );

        if (!handled) {
          console.info(
            `[SuccessFactors Profile] Passed through ${message.type || "UNKNOWN"} for existing HR/Payroll handlers.`
          );
        }
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
              ),

            stage:
              message.type ||
              "UNKNOWN"
          }
        );
      }
    }
  );

  /*
   * Do not rely only on the iframe's first READY message.
   */
  void bootstrap()
    .catch(
      (error) => {
        console.error(
          "[SuccessFactors Profile] Initial bootstrap failed.",
          error
        );

        post(
          "INTRANET_ERROR",
          {
            message:
              cleanError(
                error
              ),

            stage:
              "INITIAL_BOOTSTRAP"
          }
        );
      }
    );
});
