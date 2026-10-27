// /src/pages/SKANDI Club Log in.noml8.js
// SKANDI Club login page bridge. Customer credentials stay in the Wix auth lightboxes.

import wixLocation from "wix-location-frontend";
import { currentMember } from "wix-members-frontend";
import { APP_ROUTES, SITE_MAP, isSafeInternalRoute } from "public/siteMap.js";
import { openCustomerLogin, openCustomerResetPassword, openCustomerSignup } from "public/customerAuthUi.js";

const CLUB_MENU_BUTTON_ID = "#skandiClubMenuButton";
const LEGACY_MODAL_ID = "#skandiClubAuthModal";
const LOGIN_EMBED_ID = "#skandiClubLoginEmbed";
const LOGIN_SOURCE = "SKANDI_CLUB_LOGIN";
const LOGIN_ROUTE = SITE_MAP.clubLogin;
const ACCOUNT_PATH = APP_ROUTES.myProfile;
const MY_TRIPS_PATH = APP_ROUTES.myTrips;
const LOGIN_ROUTES = new Set([SITE_MAP.home, SITE_MAP.club, SITE_MAP.support, SITE_MAP.policies, ACCOUNT_PATH]);
let loginEmbed = null;

function getEl(selector) {
  try { return $w(selector); } catch (_) { return null; }
}

function isHtmlComponent(element) {
  return Boolean(element && typeof element.onMessage === "function" && typeof element.postMessage === "function");
}

function popupContext(extra = {}) {
  return { sourcePage: "SKANDI_CLUB_LOGIN", returnTo: LOGIN_ROUTE, ...extra };
}

$w.onReady(async function () {
  loginEmbed = getEl(LOGIN_EMBED_ID);
  if (isHtmlComponent(loginEmbed)) loginEmbed.onMessage(handleLoginEmbedMessage);

  const trigger = getEl(CLUB_MENU_BUTTON_ID);
  if (trigger && typeof trigger.onClick === "function") {
    trigger.onClick(() => openClubLoginFromCode({ trigger: "PAGE_BUTTON" }));
  }

  // Backward-compatible bridge only. The legacy custom HTML auth modal is no
  // longer required; if it still exists in Wix, its actions are redirected to
  // the canonical Wix popups and the element is kept hidden/collapsed.
  const legacyModal = getEl(LEGACY_MODAL_ID);
  if (isHtmlComponent(legacyModal)) {
    legacyModal.onMessage(handleLegacyModalMessage);
    try { if (typeof legacyModal.hide === "function") await legacyModal.hide(); } catch (_) {}
    try { if (typeof legacyModal.collapse === "function") await legacyModal.collapse(); } catch (_) {}
  }

  const query = wixLocation.query || {};
  if (String(query.forgotPassword || query.resetPassword || "") === "1") {
    await openClubResetPasswordFromCode({ trigger: "QUERY" });
    return;
  }
  if (String(query.signup || query.join || "") === "1") {
    await openClubSignupFromCode({ trigger: "QUERY" });
    return;
  }
  if (String(query.openClub || query.login || "") === "1") {
    await openClubLoginFromCode({ trigger: "QUERY" });
  }
});

async function handleLegacyModalMessage(event) {
  const data = event?.data || {};
  if (data.source !== "SKANDI_CLUB_AUTH_MODAL") return;

  switch (data.type) {
    case "LOGIN":
      await openClubLoginFromCode({ trigger: "LEGACY_MODAL", intent: "login" });
      return;
    case "SIGNUP":
      await openClubSignupFromCode({ trigger: "LEGACY_MODAL" });
      return;
    case "FORGOT_PASSWORD":
      await openClubResetPasswordFromCode({ trigger: "LEGACY_MODAL" });
      return;
    case "ACCOUNT":
      wixLocation.to(ACCOUNT_PATH);
      return;
    case "MY_TRIPS":
      wixLocation.to(MY_TRIPS_PATH);
      return;
    default:
      return;
  }
}

function parseMessage(value) {
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch (_) { return null; }
  }
  return value && typeof value === "object" ? value : null;
}

function reply(type, payload = {}) {
  if (!isHtmlComponent(loginEmbed)) return;
  loginEmbed.postMessage({ source:"SKANDI_WIX_PARENT", type, payload, timestamp:new Date().toISOString() });
}

async function handleLoginEmbedMessage(event) {
  const message = parseMessage(event?.data);
  if (!message || message.source !== LOGIN_SOURCE) return;
  const payload = message.payload && typeof message.payload === "object" ? message.payload : {};
  try {
    switch (message.type) {
      case "SKANDI_CLUB_LOGIN_READY":
        reply("SKANDI_CLUB_LOGIN_PARENT_READY", { route:LOGIN_ROUTE });
        return;
      case "SKANDI_CLUB_LOGIN_OPEN":
        await openClubLoginFromCode({ trigger:"LOGIN_PAGE" });
        return;
      case "SKANDI_CLUB_SIGNUP_OPEN":
        await openClubSignupFromCode({ trigger:"LOGIN_PAGE" });
        return;
      case "SKANDI_CLUB_RESET_OPEN":
        await openClubResetPasswordFromCode({ trigger:"LOGIN_PAGE" });
        return;
      case "SKANDI_CLUB_LOGIN_NAVIGATE": {
        const target = String(payload.path || "").trim();
        if (LOGIN_ROUTES.has(target) && isSafeInternalRoute(target)) wixLocation.to(target);
        return;
      }
      case "SKANDI_CLUB_LOGIN_HEIGHT": {
        const height = Number(payload.height || 0);
        if (Number.isFinite(height) && height > 0 && loginEmbed) loginEmbed.height = Math.max(720, Math.min(1800, Math.ceil(height)));
        return;
      }
      default:
        return;
    }
  } catch (error) {
    console.error("[SKANDI Club Login] Wix auth popup failed to open.", error);
    reply("SKANDI_CLUB_LOGIN_ERROR", { message:"We could not open the sign-in window. Please try again." });
  }
}

export function openClubModalFromCode(context = {}) {
  return openClubLoginFromCode({ trigger: "COMPATIBILITY_EXPORT", ...context });
}

export function openClubLoginFromCode(context = {}) {
  return openCustomerLogin(popupContext(context));
}

export function openClubSignupFromCode(context = {}) {
  return openCustomerSignup(popupContext(context));
}

export function openClubResetPasswordFromCode(context = {}) {
  return openCustomerResetPassword(popupContext(context));
}

export async function getClubMemberStatus() {
  try {
    const member = await currentMember.getMember();
    if (!member) return { loggedIn: false };
    const firstName = member.contactDetails?.firstName || "";
    const lastName = member.contactDetails?.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();
    return {
      loggedIn: true,
      memberId: member._id,
      email: member.loginEmail || "",
      name: fullName || member.profile?.nickname || member.loginEmail || "SKANDI Club member"
    };
  } catch (_) {
    return { loggedIn: false };
  }
}
