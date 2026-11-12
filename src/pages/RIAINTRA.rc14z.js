// /src/pages/RIAINTRA Login.js
// Route: /riaintra
// HTML Embed ID: #staffLoginEmbed
// Backend Base 1.0 / B-002 — canonical Wix Members + Supabase staff identity bridge (30-Day Device Trust MFA).

import wixLocationFrontend from "wix-location-frontend";
import { authentication } from "wix-members-frontend";
import { local } from "wix-storage-frontend";
import { createStaffActivitySession } from "public/riaintraSession.js";
import { getStaffPortalSession } from "backend/SKANDI_CORE/staffAuth.web";
import {
  issueStaffDeviceToken,
  authenticateStaffWithDeviceTrust,
  verifyStaffOtpAndTrustDevice
} from "backend/SKANDI_CORE/staffOtp.web";

const EMBED_ID = "#staffLoginEmbed";
const CHILD_SOURCE = "SKANDI_STAFF_LOGIN";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const STAFF_DASHBOARD_PATH = "/riaintra/success-factors";
const DEVICE_TOKEN_STORAGE_KEY = "skandi_device_token_v1";

const staffActivitySession = createStaffActivitySession(local);
const SK_ID_PATTERN = /^[A-Z]{2}[0-9]{4}$/;
const OTP_PATTERN = /^[0-9]{6}$/;

let html;
let actionInProgress = false;
let redirecting = false;
let transientDeviceToken = "";

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

    if (msg.type === "STAFF_OTP_VERIFY") {
      await handleOtpVerify(payload, requestId);
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
  actionInProgress = false;
  redirecting = false;
  if (staffActivitySession.active()) {
    try {
      const session = unwrapResult(await getStaffPortalSession());
      if (session?.loggedIn && session?.authorized && staffActivitySession.active()) {
        postToEmbed("STAFF_LOGIN_NOTICE", {
          message: "Enter your SK-ID and password to sign in. Your session ends after 30 minutes of inactivity."
        }, requestId);
        return;
      }
    } catch (_) { /* Require a fresh sign-in if authorization cannot be verified. */ }
  }
  staffActivitySession.clear();
  try { await authentication.logout(); } catch (_) {}
  postToEmbed("STAFF_LOGIN_NOTICE", {
    message: "Enter your SK-ID and password to sign in. Your session ends after 30 minutes of inactivity."
  }, requestId);
}

// STEP 1: Verify SK-ID + Password & check 30-day device trust
async function handleLoginRequest(payload, requestId) {
  if (actionInProgress) {
    throw new PublicError("A sign-in action is already in progress.");
  }

  const skId = cleanSkId(payload.skId);
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!SK_ID_PATTERN.test(skId)) {
    throw new PublicError("Enter a valid SK-ID.");
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
      message: "Validating SK-ID and device trust..."
    }, requestId);

    const deviceToken = await getOrCreateDeviceToken();
    const result = unwrapResult(await authenticateStaffWithDeviceTrust({
      skId,
      password,
      deviceToken,
      userAgent: getSafeUserAgent()
    }));

    if (!result?.ok) {
      throw new PublicError(result?.message || "The SK-ID or password is incorrect.");
    }

    // New or expired (> 30 days) device: require 6-digit email OTP
    if (result.mfaRequired) {
      actionInProgress = false;
      postToEmbed("STAFF_OTP_REQUIRED", {
        ok: true,
        skId,
        maskedEmail: String(result.maskedEmail || "")
      }, requestId);
      return;
    }

    // Known trusted device (< 30 days): complete Wix Member login immediately
    const sessionToken = String(result?.sessionToken || "").trim();
    if (!sessionToken) {
      throw new Error("The authentication service did not return a session token.");
    }

    await finalizeWixSession(sessionToken, requestId);
  } catch (error) {
    actionInProgress = false;
    throw error;
  }
}

// STEP 2: Verify 6-digit OTP on a new/expired device & trust for 30 days
async function handleOtpVerify(payload, requestId) {
  if (actionInProgress) {
    throw new PublicError("A sign-in action is already in progress.");
  }

  const skId = cleanSkId(payload.skId);
  const code = String(payload.code || "").replace(/\D/g, "").slice(0, 6);

  if (!SK_ID_PATTERN.test(skId)) {
    throw new PublicError("Enter a valid SK-ID.");
  }

  if (!OTP_PATTERN.test(code)) {
    throw new PublicError("Enter the 6-digit verification code sent to your email.");
  }

  actionInProgress = true;

  try {
    postToEmbed("STAFF_LOGIN_PROGRESS", {
      message: "Verifying code and registering trusted device..."
    }, requestId);

    const deviceToken = await getOrCreateDeviceToken();
    const result = unwrapResult(await verifyStaffOtpAndTrustDevice({
      skId,
      code,
      deviceToken,
      userAgent: getSafeUserAgent()
    }));

    if (!result?.ok) {
      throw new PublicError(result?.message || "Invalid or expired verification code.");
    }

    const sessionToken = String(result?.sessionToken || "").trim();
    if (!sessionToken) {
      throw new Error("The authentication service did not return a session token.");
    }

    await finalizeWixSession(sessionToken, requestId);
  } catch (error) {
    actionInProgress = false;
    throw error;
  }
}

// Shared helper to apply Wix session token, verify authorization, and start activity session
async function finalizeWixSession(sessionToken, requestId) {
  postToEmbed("STAFF_LOGIN_PROGRESS", {
    message: "Checking connection..."
  }, requestId);

  await authentication.applySessionToken(sessionToken);

  postToEmbed("STAFF_LOGIN_PROGRESS", {
    message: "Preparing your RIAINTRA experience..."
  }, requestId);

  const session = await waitForAuthorizedSession();

  if (!session?.loggedIn || !session?.authorized) {
    throw new PublicError(sessionReasonMessage(session?.reason));
  }

  try {
    staffActivitySession.start();
  } catch (error) {
    try { await authentication.logout(); } catch (_) {}
    throw new PublicError("We encountered an error on our end. Please try signing in again.");
  }

  postToEmbed("STAFF_LOGIN_OK", {
    message: "Signed in. Opening RIAINTRA...",
    profile: publicProfile(session.profile),
    apps: safeApps(session.apps)
  }, requestId);

  redirectToDashboard();
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
      message: "Opening password reset..."
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
      message: "If the account exists, password reset instructions will be sent by email to SK-ID account owner."
    }, requestId);
  } finally {
    actionInProgress = false;
  }
}

async function getOrCreateDeviceToken() {
  let token = transientDeviceToken;
  if (!/^v2_[a-f0-9]{64}$/.test(token)) {
    try {
      token = String(local.getItem(DEVICE_TOKEN_STORAGE_KEY) || "").trim();
    } catch (_) {}
  }
  if (!/^v2_[a-f0-9]{64}$/.test(token)) {
    const issued = unwrapResult(await issueStaffDeviceToken());
    token = String(issued?.deviceToken || "").trim();
    if (!/^v2_[a-f0-9]{64}$/.test(token)) throw new Error("Device verification is unavailable.");
    transientDeviceToken = token;
    try {
      local.setItem(DEVICE_TOKEN_STORAGE_KEY, token);
    } catch (_) {}
  }
  return token;
}

function getSafeUserAgent() {
  try {
    return typeof navigator !== "undefined" && navigator.userAgent
      ? String(navigator.userAgent).slice(0, 200)
      : "";
  } catch (_) {
    return "";
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
    STAFF_PROFILE_NOT_FOUND: "No active SKANDI staff profile is linked to this SK-ID.",
    STAFF_PROFILE_INACTIVE: "This staff account is inactive.",
    STAFF_PROFILE_NOT_AUTHORIZED: "Not authorized for RIAINTRA.",
    STAFF_PROFILE_PORTAL_DISABLED: "RIAINTRA access is disabled.",
    STAFF_ACCESS_ROLE_MISSING: "No system access role is assigned to this staff account.",
    STAFF_ACCESS_ROLE_INVALID: "The assigned system access role is not active.",
    STAFF_PERMISSION_PRESET_MISSING: "No permission is assigned to this staff account.",
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
    Object.prototype.hasOwnProperty.call(value, "ok") ||
    Object.prototype.hasOwnProperty.call(value, "mfaRequired")
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
