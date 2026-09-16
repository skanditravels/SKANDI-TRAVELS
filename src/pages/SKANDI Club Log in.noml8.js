// /src/pages/SKANDI Club Log in.noml8.js
// SKANDI Club page-level auth launcher — B-011.23.
// Canonical Wix popups:
// - Log In Form (Popup) / Log In Form (Popup).bytg4.js
// - Reset Password (Popup) / Reset Password (Popup).rygmm.js
// The global header is intentionally excluded from this page-level contract.

import wixLocation from "wix-location-frontend";
import { currentMember } from "wix-members-frontend";
import { APP_ROUTES } from "public/siteMap.js";
import { openCustomerLogin, openCustomerResetPassword } from "public/customerAuthUi.js";

const CLUB_MENU_BUTTON_ID = "#skandiClubMenuButton";
const LEGACY_MODAL_ID = "#skandiClubAuthModal";
const ACCOUNT_PATH = APP_ROUTES.myProfile;
const MY_TRIPS_PATH = APP_ROUTES.myTrips;

function getEl(selector) {
  try { return $w(selector); } catch (_) { return null; }
}

function isHtmlComponent(element) {
  return Boolean(element && typeof element.onMessage === "function" && typeof element.postMessage === "function");
}

function popupContext(extra = {}) {
  return { sourcePage: "SKANDI_CLUB", returnTo: wixLocation.path?.length ? `/${wixLocation.path.join("/")}` : "/skandi-club", ...extra };
}

$w.onReady(async function () {
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
      await openClubLoginFromCode({ trigger: "LEGACY_MODAL", intent: "signup" });
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

export function openClubModalFromCode(context = {}) {
  return openClubLoginFromCode({ trigger: "COMPATIBILITY_EXPORT", ...context });
}

export function openClubLoginFromCode(context = {}) {
  return openCustomerLogin(popupContext(context));
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
