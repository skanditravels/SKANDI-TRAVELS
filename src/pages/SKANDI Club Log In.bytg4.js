// Wix popup: SKANDI Club Log In. Customer passwords never enter staff sign-in.
import wixWindowFrontend from "wix-window-frontend";
import wixLocationFrontend from "wix-location-frontend";
import { authentication, currentMember } from "wix-members-frontend";
import { session } from "wix-storage-frontend";
import { loginClubMember } from "backend/SKANDI_CORE/clubLogin.web";
import { getPublicPagePresentation } from "backend/SKANDI_CORE/presentation.web";
import { openCustomerSignup, openCustomerResetPassword } from "public/customerAuthUi";
import { SITE_MAP, isSafeInternalRoute } from "public/siteMap";

const SOURCE = "SKANDI_CLUB_LOGIN";
const PARENT = "SKANDI_WIX_PARENT";
const allowedRoutes = new Set([SITE_MAP.home, SITE_MAP.club, SITE_MAP.support, SITE_MAP.policies]);
let embed;
let captcha;
let busy = false;

function reply(type, payload = {}) {
  if (embed && typeof embed.postMessage === "function") embed.postMessage({ source: PARENT, type, payload });
}
function resetCaptcha() {
  try { captcha?.reset(); } catch (_) {}
  reply("SKANDI_CLUB_CAPTCHA", { verified: false });
}
function parse(value) {
  if (typeof value === "string") { try { return JSON.parse(value); } catch (_) { return null; } }
  return value && typeof value === "object" ? value : null;
}

$w.onReady(function () {
  try { embed = $w("#html1"); } catch (_) { embed = null; }
  try { captcha = $w("#clubLoginCaptcha"); } catch (_) { captcha = null; }
  if (!embed || typeof embed.onMessage !== "function") return;
  try { embed.scrolling = "auto"; } catch (_) {}
  wixWindowFrontend.getBoundingRect().then(rect => {
    const height = Number(rect?.window?.height);
    if (Number.isFinite(height) && height > 0) embed.height = Math.max(200, Math.floor(height - 100));
  }).catch(() => {});
  if (captcha && typeof captcha.onVerified === "function") {
    captcha.onVerified(() => reply("SKANDI_CLUB_CAPTCHA", { verified: Boolean(captcha.token) }));
    captcha.onTimeout(() => reply("SKANDI_CLUB_CAPTCHA", { verified: false }));
    captcha.onError(() => reply("SKANDI_CLUB_LOGIN_ERROR", { message: "Verification is unavailable. Please try again." }));
  }
  embed.onMessage(async event => {
    const message = parse(event?.data);
    if (!message || message.source !== SOURCE) return;
    const payload = message.payload && typeof message.payload === "object" ? message.payload : {};
    try {
      switch (message.type) {
        case "SKANDI_CLUB_LOGIN_READY":
          reply("SKANDI_CLUB_LOGIN_PARENT_READY", { captchaAvailable: Boolean(captcha), captchaVerified: Boolean(captcha?.token) });
          try { reply("SKANDI_CLUB_BRAND", JSON.parse(session.getItem("SKANDI_CLUB_BRAND") || "{}")); } catch (_) {}
          return;
        case "SKANDI_PRESENTATION_READY":
          try { reply("SKANDI_PRESENTATION_DATA", await getPublicPagePresentation({ path: SITE_MAP.clubLogin })); } catch (_) {}
          return;
        case "SKANDI_CLUB_LOGIN_SUBMIT": {
          if (busy) return;
          if (!captcha?.token) { reply("SKANDI_CLUB_LOGIN_ERROR", { message: "Please complete the verification below and try again." }); return; }
          busy = true;
          try {
            const existing = await currentMember.getMember();
            if (existing) { reply("SKANDI_CLUB_LOGIN_ERROR", { message: "You’re already signed in. Sign out before switching accounts." }); return; }
            const result = await loginClubMember({ email: payload.email, password: payload.password, captchaToken: captcha.token });
            if (!result?.sessionToken) throw new Error("LOGIN_UNAVAILABLE");
            await authentication.applySessionToken(result.sessionToken);
            wixWindowFrontend.lightbox.close({ action: "SIGNED_IN" });
          } finally { busy = false; resetCaptcha(); }
          return;
        }
        case "SKANDI_CLUB_SIGNUP_OPEN":
          await openCustomerSignup({ sourcePage: "SKANDI_CLUB_LOGIN" });
          return;
        case "SKANDI_CLUB_RESET_OPEN":
          await openCustomerResetPassword({ sourcePage: "SKANDI_CLUB_LOGIN" });
          return;
        case "SKANDI_CLUB_LOGIN_NAVIGATE": {
          const target = String(payload.path || "").trim();
          if (allowedRoutes.has(target) && isSafeInternalRoute(target)) wixLocationFrontend.to(target);
          return;
        }
        default:
          return;
      }
    } catch (_) {
      resetCaptcha();
      reply("SKANDI_CLUB_LOGIN_ERROR", { message: "We couldn't complete your request. Please check your details and try again." });
    }
  });
});
