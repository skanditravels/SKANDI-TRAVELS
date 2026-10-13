import wixLocationFrontend from "wix-location-frontend";
import { authentication } from "wix-members-frontend";
import { SITE_MAP } from "public/siteMap";

const HTML_ID = "#forgotPasswordHtml";
const CHILD_SOURCE = "SKANDI_FORGOT_PASSWORD";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function send(html, type, payload = {}) {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function isCancellation(error) {
  const value = String(error?.message || error || "").toLowerCase();
  return value.includes("cancel") || value.includes("closed") || value.includes("abort");
}

$w.onReady(function () {
  const html = $w(HTML_ID);

  html.onMessage(async (event) => {
    const message = event.data || {};
    if (message.source !== CHILD_SOURCE) return;

    if (message.type === "FORGOT_PASSWORD_READY") {
      send(html, "FORGOT_PASSWORD_RESULT", {
        ok: true,
        message: "Ready to start a secure Wix Members password reset."
      });
      return;
    }

    if (message.type === "FORGOT_PASSWORD_OPEN_RESET") {
      try {
        await authentication.promptForgotPassword();
        send(html, "FORGOT_PASSWORD_RESULT", {
          ok: true,
          message: "Password reset completed or reset instructions were requested through Wix Members."
        });
      } catch (error) {
        if (isCancellation(error)) {
          send(html, "FORGOT_PASSWORD_RESULT", {
            ok: true,
            message: "Password reset was closed. You can reopen it whenever you are ready."
          });
          return;
        }

        send(html, "FORGOT_PASSWORD_RESULT", {
          ok: false,
          message: "Password reset is temporarily unavailable. Please try again."
        });
      }
      return;
    }

    if (message.type === "FORGOT_PASSWORD_OPEN_LOGIN") {
      wixLocationFrontend.to(`${SITE_MAP.club}?login=1`);
    }
  });
});
