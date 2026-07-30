// pages/staff-login.js
// HTML Embed ID: #staffLoginEmbed

import wixLocationFrontend from "wix-location-frontend";
import { authentication } from "wix-members-frontend";
import {
  loginStaffWithSkId,
  getStaffPortalSession
} from "src/backend/RIA/staffPortalAuth.web";

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
      const session = unwrapResult(await getStaffPortalSession());

      if (session?.loggedIn === true && session?.authorized === true) {
        redirectToDashboard();
      }

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
    postToEmbed("STAFF_LOGIN_ERROR", {
      message: cleanError(err)
    }, requestId);
  }
}

async function handleLoginRequest(payload, requestId) {
  if (actionInProgress) {
    throw new PublicError("A sign-in action is already in progress.");
  }

  const skId = cleanSkId(payload.skId);
  const password =
    typeof payload.password === "string" ? payload.password : "";

  if (!SK_ID_PATTERN.test(skId)) {
    throw new PublicError(
      "Enter a valid SK-ID in the AA0000 format."
    );
  }

  if (!password.trim()) {
    throw new PublicError("Enter your password.");
  }

  if (password.length > 256) {
    throw new PublicError("The password is too long.");
  }

  actionInProgress = true;
  let loginSucceeded = false;

  try {
    postToEmbed("STAFF_LOGIN_PROGRESS", {
      message: "Validating SK-ID..."
    }, requestId);

    const result = unwrapResult(
      await loginStaffWithSkId({
        skId,
        password
      })
    );

    if (result?.success === false) {
      throw new Error(
        String(result?.message || result?.error || "Login failed.")
      );
    }

    if (result?.authorized === false) {
      throw new PublicError(
        "This account is not authorized for the staff portal."
      );
    }

    const sessionToken =
      String(result?.sessionToken || "").trim();

    if (!sessionToken) {
      throw new Error(
        "The authentication service did not return a session token."
      );
    }

    postToEmbed("STAFF_LOGIN_PROGRESS", {
      message: "Signing in..."
    }, requestId);

    await authentication.applySessionToken(sessionToken);
    loginSucceeded = true;

    postToEmbed("STAFF_LOGIN_OK", {
      message: "Signed in. Opening staff portal..."
    }, requestId);

    setTimeout(redirectToDashboard, 600);
  } finally {
    if (!loginSucceeded) {
      actionInProgress = false;
    }
  }
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
      message:
        "If the account exists, password reset instructions will be sent by Wix."
    }, requestId);
  } finally {
    actionInProgress = false;
  }
}

function postToEmbed(type, payload = {}, requestId = "") {
  const message = {
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  };

  if (requestId) {
    message.requestId = requestId;
  }

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
  return typeof value === "string"
    ? value.slice(0, 100)
    : "";
}

function unwrapResult(value) {
  if (!isRecord(value)) return value;

  if (
    Object.prototype.hasOwnProperty.call(value, "sessionToken") ||
    Object.prototype.hasOwnProperty.call(value, "loggedIn") ||
    Object.prototype.hasOwnProperty.call(value, "authorized")
  ) {
    return value;
  }

  for (const key of ["payload", "data", "result"]) {
    if (isRecord(value[key])) {
      return value[key];
    }
  }

  return value;
}

function isRecord(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function isCancellation(err) {
  const text =
    String(err?.message || err || "").toLowerCase();

  return (
    text.includes("cancel") ||
    text.includes("closed")
  );
}

function cleanError(err) {
  if (err instanceof PublicError) {
    return err.message;
  }

  const text = [
    err?.code,
    err?.message,
    err
  ]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");

  if (
    text.includes("invalid credential") ||
    text.includes("incorrect password") ||
    text.includes("wrong password") ||
    text.includes("member not found")
  ) {
    return "The SK-ID or password is incorrect.";
  }

  if (
    text.includes("not authorized") ||
    text.includes("access denied") ||
    text.includes("forbidden")
  ) {
    return "This account is not authorized for the staff portal.";
  }

  if (
    text.includes("too many") ||
    text.includes("rate limit") ||
    text.includes("throttl")
  ) {
    return "Too many sign-in attempts. Please wait and try again.";
  }

  if (
    text.includes("network") ||
    text.includes("timeout") ||
    text.includes("fetch")
  ) {
    return "The sign-in service could not be reached. Please try again.";
  }

  return "Unable to sign in. Please try again.";
}

class PublicError extends Error {
  constructor(message) {
    super(message);
    this.name = "PublicError";
  }
}
