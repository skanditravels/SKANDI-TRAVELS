// Page URL: /riaintra/success-factors/altea
// HTML Embed ID: #alteaDashboardEmbed

import wixLocation from "wix-location";
import {
  getStaffPortalSession
} from "backend/RIA/staffPortalAuth.web";

const EMBED_ID = "#alteaDashboardEmbed";
const STAFF_LOGIN_PATH = "/riaintra";
const ALLOWED_PATH_PREFIXES = ["/riaintra"];

let sessionPromise = null;

$w.onReady(function () {
  const html = $w(EMBED_ID);

  html.onMessage(async (event) => {
    const message = event?.data;

    if (!message || typeof message !== "object") {
      return;
    }

    try {
      if (message.type === "NAVIGATE") {
        openInternalPath(
          message.path || message.payload?.path
        );
        return;
      }

      if (
        message.type === "UI_READY" ||
        message.type === "PROFILE_REFRESH" ||
        message.type === "INTERNAL_CHROME_READY"
      ) {
        await sendStaffProfile(html);
      }
    } catch (error) {
      handlePageError(html, error);
    }
  });

  // Covers the possibility that UI_READY was sent
  // before the Wix onMessage listener was attached.
  sendStaffProfile(html).catch((error) => {
    handlePageError(html, error);
  });
});

async function getSession() {
  if (!sessionPromise) {
    sessionPromise = getStaffPortalSession().finally(() => {
      sessionPromise = null;
    });
  }

  return sessionPromise;
}

async function sendStaffProfile(html) {
  const session = await getSession();

  /*
   * Supports both staff-auth response formats:
   *
   * Older:
   * {
   *   loggedIn,
   *   authorized,
   *   profile,
   *   apps
   * }
   *
   * Supabase version:
   * {
   *   authorized,
   *   agent,
   *   checkedAt
   * }
   */
  const profile =
    session?.profile ||
    session?.agent ||
    null;

  if (session?.authorized !== true || !profile) {
    post(html, "PROFILE_ERROR", {
      code: session?.code || "STAFF_ACCESS_DENIED"
    });

    wixLocation.to(STAFF_LOGIN_PATH);
    return;
  }

  /*
   * Your HTML already listens for MEMBER_DATA and
   * passes its payload into updateProfile().
   */
  post(html, "MEMBER_DATA", profile);
}

function openInternalPath(rawPath) {
  const path = String(rawPath || "").trim();

  if (!path) {
    throw new Error("Missing internal destination.");
  }

  const allowed = ALLOWED_PATH_PREFIXES.some(
    (prefix) =>
      path === prefix ||
      path.startsWith(`${prefix}/`)
  );

  if (!allowed) {
    throw new Error("Invalid internal destination.");
  }

  wixLocation.to(path);
}

function post(html, type, payload = {}) {
  html.postMessage({
    source: "SKANDI_WIX_PARENT",
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function handlePageError(html, error) {
  console.error("[ALTEA Dashboard]", error);

  post(html, "PROFILE_ERROR", {
    code: "PROFILE_LOAD_FAILED"
  });
}
