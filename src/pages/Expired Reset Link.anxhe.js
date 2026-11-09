// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import wixLocationFrontend from "wix-location-frontend";
import { authentication } from "wix-members-frontend";
import { SITE_MAP } from "public/siteMap";
import { openCustomerLogin } from "public/customerAuthUi";

const HTML_ID = "#expiredResetEmbed";
const CHILD_SOURCE = "SKANDI_EXPIRED_RESET_LINK";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
let authBusy = false;

function send(html, type, payload = {}, requestId = "") {
  html.postMessage({ source:PARENT_SOURCE, type, payload, requestId });
}
function cancelled(error) {
  return /cancel|closed|dismiss/i.test(String(error?.message || error || ""));
}

$w.onReady(function () {
  let html;
  try { html = $w(HTML_ID); } catch (_) { return; }
  if (!html || typeof html.onMessage !== "function") return;

  html.onMessage(async event => {
    const message = event?.data || {};
    if (message.source !== CHILD_SOURCE) return;
    if (message.type === "EXPIRED_RESET_BACK") {
      try { await wixLocationFrontend.to(SITE_MAP.forgotPassword, { disableScrollToTop:false }); }
      catch (_) { send(html, "EXPIRED_RESET_BACK_ERROR"); }
      return;
    }
    if (message.type !== "EXPIRED_RESET_AUTH") return;
    const action = message.payload?.action;
    const requestId = String(message.requestId || "").slice(0, 100);
    if ((action !== "reset" && action !== "login") || !/^expired-reset-[0-9]+-[0-9]+$/.test(requestId)) return;
    if (authBusy) {
      send(html, "EXPIRED_RESET_AUTH_RESULT", { message:"Please complete or close the open window first." }, requestId);
      return;
    }
    authBusy = true;
    send(html, "EXPIRED_RESET_AUTH_OPENING", {}, requestId);
    try {
      if (action === "reset") {
        await authentication.promptForgotPassword();
        send(html, "EXPIRED_RESET_AUTH_RESULT", { message:"If the email matches an account, check your inbox for a new reset link." }, requestId);
      } else {
        const result = await openCustomerLogin({ sourcePage:"EXPIRED_RESET_LINK", returnTo:SITE_MAP.club });
        if (result?.action === "SIGNED_IN") {
          send(html, "EXPIRED_RESET_AUTH_RESULT", { message:"You’re signed in." }, requestId);
          try { await wixLocationFrontend.to(SITE_MAP.club, { disableScrollToTop:false }); }
          catch (_) { console.warn("[Expired Reset Link] Could not open the Club page after sign-in."); }
        } else {
          send(html, "EXPIRED_RESET_AUTH_RESULT", { message:"The login window was closed." }, requestId);
        }
      }
    } catch (error) {
      const messageText = cancelled(error) ? "The window was closed. You can try again whenever you’re ready." : "We couldn’t complete the request. Please try again.";
      send(html, "EXPIRED_RESET_AUTH_RESULT", { message:messageText }, requestId);
    } finally {
      authBusy = false;
    }
  });
});
