// pages/staff-login.js
// HTML Embed ID: #staffLoginEmbed

import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";
import {
  loginStaffWithSkId,
  getStaffPortalSession
} from "backend/RIA/staffPortalAuth.web";

const EMBED_ID = "#staffLoginEmbed";
const STAFF_DASHBOARD_PATH = "/riaintra/staff-portal";

$w.onReady(function () {
  const html = $w(EMBED_ID);

  html.onMessage(async (event) => {
    const msg = event.data || {};
    const payload = msg.payload || {};

    if (msg.source !== "SKANDI_STAFF_LOGIN") return;

    try {
      if (msg.type === "STAFF_LOGIN_READY") {
        const session = await getStaffPortalSession();

        if (session.loggedIn && session.authorized) {
          redirectToDashboard();
        }

        return;
      }

      if (msg.type === "STAFF_LOGIN_REQUEST") {
        postToEmbed("STAFF_LOGIN_PROGRESS", {
          message: "Validating SK-ID..."
        });

        const result = await loginStaffWithSkId({
          skId: payload.skId,
          password: payload.password
        });

        if (!result?.sessionToken) {
          throw new Error("Missing session token.");
        }

        postToEmbed("STAFF_LOGIN_PROGRESS", {
          message: "Signing in..."
        });

        await authentication.applySessionToken(result.sessionToken);

        postToEmbed("STAFF_LOGIN_OK", {
          message: "Signed in. Opening staff portal..."
        });

        setTimeout(() => {
          redirectToDashboard();
        }, 600);

        return;
      }

      if (msg.type === "STAFF_FORGOT_PASSWORD") {
        postToEmbed("STAFF_LOGIN_PROGRESS", {
          message: "Opening password reset..."
        });

        await authentication.promptForgotPassword();

        postToEmbed("STAFF_LOGIN_NOTICE", {
          message: "If the account exists, password reset instructions will be sent by Wix."
        });

        return;
      }
    } catch (err) {
      postToEmbed("STAFF_LOGIN_ERROR", {
        message: cleanError(err)
      });
    }
  });
});

function postToEmbed(type, payload = {}) {
  $w(EMBED_ID).postMessage({
    source: "SKANDI_WIX_PARENT",
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function redirectToDashboard() {
  wixLocation.to(STAFF_DASHBOARD_PATH);
}

function cleanError(err) {
  const msg = String(err?.message || err || "").trim();
  return msg || "Unable to sign in.";
}