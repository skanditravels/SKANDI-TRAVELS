// /src/pages/RIAINTRA Login.js
// Route: /riaintra
// HTML Embed ID: #staffLoginEmbed
// R-003.8 — canonical Wix Members + Supabase staff identity bridge.

import wixLocationFrontend from "wix-location-frontend";
import { authentication } from "wix-members-frontend";
import {
  loginStaffWithSkId,
  getStaffPortalSession
} from "backend/RIA/staffPortalAuth.web";

const EMBED_ID = "#staffLoginEmbed";
const CHILD_SOURCE = "SKANDI_STAFF_LOGIN";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const STAFF_DASHBOARD_PATH = "/riaintra/success-factors";
const SK_ID_PATTERN = /^[A-Z]{2}[0-9]{4}$/;

let html;
let actionInProgress = false;
let redirecting = false;

$w.onReady(function () {
  html = $w(EMBED_ID);
  html.onMessage(handleEmbedMessage);
});

async function handleEmbedMessage(event) {
  const msg = event?.data || {};
  if (msg.source !== CHILD_SOURCE) return;

  const payload = isRecord(msg.payload) ? msg.payload : {};
  const requestId = cleanRequestId(msg.requestId);

  try {
    if (msg.type === "STAFF_LOGIN_READY") {
      await handleReady(requestId);
      return;
    }

    if (msg.type === "STAFF_LOGIN_REQUEST") {
      await handleLoginRequest(payload, requestId);
      return;
    }

    if (msg.type === "STAFF_FORGOT_PASSWORD") {
      await handleForgotPassword(requestId);
    }
  } catch (err) {
    actionInProgress = false;
    postToEmbed("STAFF_LOGIN_ERROR", { message: cleanError(err) }, requestId);
  }
}

async function handleReady(requestId) {
  const session = unwrapResult(await getStaffPortalSession());

  if (session?.loggedIn === true && session?.authorized === true) {
    postToEmbed("STAFF_LOGIN_OK", {
      message: "Session active. Opening RIAINTRA...",
      profile: publicProfile(session.profile),
      apps: safeApps(session.apps)
    }, requestId);
    redirectToDashboard();
    return;
  }

  if (session?.loggedIn === true && session?.authorized !== true) {
    postToEmbed("STAFF_LOGIN_ERROR", {
      message: sessionReasonMessage(session?.reason)
    }, requestId);
    return;
  }

  postToEmbed("STAFF_LOGIN_NOTICE", {
    message: "Secure staff login ready."
  }, requestId);
}

async function handleLoginRequest(payload, requestId) {
  if (actionInProgress) {
    throw new PublicError("A sign-in action is already in progress.");
  }

  const skId = cleanSkId(payload.skId);
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!SK_ID_PATTERN.test(skId)) {
    throw new PublicError("Enter a valid SK-ID in the AA0000 format.");
  }

  if (!password.trim()) {
    throw new PublicError("Enter your password.");
  }

  if (password.length > 256) {
    throw new PublicError("The password is too long.");
  }

  actionInProgress = true;

  try {
    postToEmbed("STAFF_LOGIN_PROGRESS", {
      message: "Validating SK-ID and staff access..."
    }, requestId);

    const result = unwrapResult(await loginStaffWithSkId({ skId, password }));
    const sessionToken = String(result?.sessionToken || "").trim();

    if (!sessionToken) {
      throw new Error("The authentication service did not return a session token.");
    }

    postToEmbed("STAFF_LOGIN_PROGRESS", {
      message: "Starting secure Wix member session..."
    }, requestId);

    await authentication.applySessionToken(sessionToken);

    postToEmbed("STAFF_LOGIN_PROGRESS", {
      message: "Linking your Wix session to the SKANDI staff profile..."
    }, requestId);

    const session = await waitForAuthorizedSession();

    if (!session?.loggedIn || !session?.authorized) {
      throw new PublicError(sessionReasonMessage(session?.reason));
    }

    postToEmbed("STAFF_LOGIN_OK", {
      message: "Signed in. Opening RIAINTRA...",
      profile: publicProfile(session.profile),
      apps: safeApps(session.apps)
    }, requestId);

    redirectToDashboard();
  } catch (error) {
    actionInProgress = false;
    throw error;
  }
}

async function waitForAuthorizedSession() {
  const delays = [0, 150, 350, 700, 1200];
  let latest = null;

  for (const delay of delays) {
    if (delay) await sleep(delay);
    latest = unwrapResult(await getStaffPortalSession());
    if (latest?.loggedIn === true && latest?.authorized === true) return latest;
  }

  return latest;
}

async function handleForgotPassword(requestId) {
  if (actionInProgress) {
    throw new PublicError("A sign-in action is already in progress.");
  }

  actionInProgress = true;

  try {
    postToEmbed("STAFF_LOGIN_PROGRESS", {
      message: "Opening Wix password reset..."
    }, requestId);

    try {
      await authentication.promptForgotPassword();
    } catch (err) {
      if (isCancellation(err)) {
        postToEmbed("STAFF_LOGIN_NOTICE", {
          message: "Password reset was closed."
        }, requestId);
        return;
      }
      throw err;
    }

    postToEmbed("STAFF_LOGIN_NOTICE", {
      message: "If the account exists, password reset instructions will be sent by Wix."
    }, requestId);
  } finally {
    actionInProgress = false;
  }
}

function postToEmbed(type, payload = {}, requestId = "") {
  if (!html) return;
  const message = {
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  };
  if (requestId) message.requestId = requestId;
  html.postMessage(message);
}

function redirectToDashboard() {
  if (redirecting) return;
  redirecting = true;
  wixLocationFrontend.to(STAFF_DASHBOARD_PATH);
}

function cleanSkId(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

function cleanRequestId(value) {
  return typeof value === "string" ? value.slice(0, 100) : "";
}

function publicProfile(profile) {
  if (!isRecord(profile)) return null;
  return {
    skId: String(profile.skId || ""),
    displayName: String(profile.displayName || profile.fullName || "Staff"),
    jobTitle: String(profile.jobTitle || profile.position || ""),
    station: String(profile.station || profile.base || ""),
    accessRole: String(profile.accessRole || profile.role || "")
  };
}

function safeApps(apps) {
  return Array.isArray(apps)
    ? apps.map((app) => ({
        id: String(app?.id || ""),
        title: String(app?.title || ""),
        path: String(app?.path || "")
      })).filter((app) => app.id && app.path)
    : [];
}

function sessionReasonMessage(reason) {
  const code = String(reason || "").toUpperCase();
  const messages = {
    STAFF_AUTH_REQUIRED: "Sign in with your SK-ID to access RIAINTRA.",
    STAFF_PROFILE_NOT_FOUND: "No active SKANDI staff profile is linked to this Wix member account.",
    STAFF_PROFILE_INACTIVE: "This staff account is inactive.",
    STAFF_PROFILE_NOT_AUTHORIZED: "This staff account is not authorized for RIAINTRA.",
    STAFF_PROFILE_PORTAL_DISABLED: "RIAINTRA access is disabled for this staff account.",
    STAFF_ACCESS_ROLE_MISSING: "No system access role is assigned to this staff account.",
    STAFF_ACCESS_ROLE_INVALID: "The assigned system access role is not active.",
    STAFF_PERMISSION_PRESET_MISSING: "No permission preset is assigned to this staff account.",
    STAFF_PERMISSION_PRESET_INVALID: "The assigned permission preset is not active."
  };
  return messages[code] || "This staff session is not authorized for RIAINTRA.";
}

function unwrapResult(value) {
  if (!isRecord(value)) return value;
  if (
    Object.prototype.hasOwnProperty.call(value, "sessionToken") ||
    Object.prototype.hasOwnProperty.call(value, "loggedIn") ||
    Object.prototype.hasOwnProperty.call(value, "authorized") ||
    Object.prototype.hasOwnProperty.call(value, "ok")
  ) return value;

  for (const key of ["payload", "data", "result"]) {
    if (isRecord(value[key])) return value[key];
  }
  return value;
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isCancellation(err) {
  const text = String(err?.message || err || "").toLowerCase();
  return text.includes("cancel") || text.includes("closed");
}

function cleanError(err) {
  if (err instanceof PublicError) return err.message;

  const text = [err?.code, err?.message, err]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");

  if (
    text.includes("invalid credential") ||
    text.includes("incorrect password") ||
    text.includes("wrong password") ||
    text.includes("member not found") ||
    text.includes("credentials_invalid")
  ) return "The SK-ID or password is incorrect.";

  if (text.includes("not authorized") || text.includes("access denied") || text.includes("forbidden")) {
    return "This account is not authorized for RIAINTRA.";
  }

  if (text.includes("too many") || text.includes("rate limit") || text.includes("throttl")) {
    return "Too many sign-in attempts. Please wait and try again.";
  }

  if (text.includes("network") || text.includes("timeout") || text.includes("fetch")) {
    return "The sign-in service could not be reached. Please try again.";
  }

  return "Unable to sign in. Please try again.";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class PublicError extends Error {
  constructor(message) {
    super(message);
    this.name = "PublicError";
  }
}
