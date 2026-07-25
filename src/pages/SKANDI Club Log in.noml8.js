/**
 * SKANDI Club auth modal controller — FIXED / defensive version
 *
 * Fixes:
 * - TypeError: modal.postMessage is not a function
 * - TypeError: trigger.onClick is not a function
 *
 * Required Wix elements:
 * 1) HTML Embed / HTML Component:
 *    ID: skandiClubAuthModal
 *    Must be the Wix "Embed HTML" / "HTML iframe" element, not a Box, Strip, Lightbox container, or regular iframe/site embed.
 *
 * 2) Menu trigger:
 *    ID: skandiClubMenuButton
 *    Must be a real Wix Button / Text / Image element that supports onClick().
 *    A native Wix Menu item does not work as #skandiClubMenuButton.
 */

import wixLocation from "wix-location";
import { authentication, currentMember } from "wix-members-frontend";

const CLUB_MODAL_ID = "#skandiClubAuthModal";
const CLUB_MENU_BUTTON_ID = "#skandiClubMenuButton";

const ACCOUNT_PATH = "/account/my-account";
const MY_TRIPS_PATH = "/my-trips";

$w.onReady(async function () {
  const modal = getEl(CLUB_MODAL_ID);
  const trigger = getEl(CLUB_MENU_BUTTON_ID);

  if (!modal) {
    console.error(`[SKANDI Club] Missing HTML embed ${CLUB_MODAL_ID}. Add an HTML Embed element and set its ID to skandiClubAuthModal.`);
    return;
  }

  if (!isHtmlComponent(modal)) {
    console.error(
      `[SKANDI Club] ${CLUB_MODAL_ID} exists, but it is not a Wix HTML Component. ` +
      `It must be an "Embed HTML" element because only HTML Components support postMessage() and onMessage().`
    );
  } else {
    modal.onMessage(handleModalMessage);
  }

  await setModalVisible(false);
  await sendToModal("CLOSE", {});

  if (trigger && typeof trigger.onClick === "function") {
    trigger.onClick(openClubModal);
  } else if (trigger) {
    console.error(
      `[SKANDI Club] ${CLUB_MENU_BUTTON_ID} exists, but it does not support onClick(). ` +
      `This usually means it is a native Wix Menu element/menu item. ` +
      `Use a real Wix Button/Text/Image element with ID skandiClubMenuButton, or use the page-load option in the README.`
    );
  } else {
    console.warn(`[SKANDI Club] Optional trigger ${CLUB_MENU_BUTTON_ID} not found. You can still open by calling openClubModalFromCode().`);
  }

  // Optional: if you link a normal Wix menu item to /skandi-club-sign-up?openClub=1
  // this opens the modal automatically on that page.
  if (String(wixLocation.query?.openClub || "") === "1") {
    await openClubModal();
  }
});

async function handleModalMessage(event) {
  const data = event.data || {};
  if (data.source !== "SKANDI_CLUB_AUTH_MODAL") return;

  switch (data.type) {
    case "READY":
      await postStatus();
      break;

    case "CLOSE":
      await closeClubModal();
      break;

    case "LOGIN":
      await closeClubModal();
      await openNativeAuth("login");
      break;

    case "SIGNUP":
      await closeClubModal();
      await openNativeAuth("signup");
      break;

    case "FORGOT_PASSWORD":
      await closeClubModal();
      await openForgotPassword();
      break;

    case "ACCOUNT":
      wixLocation.to(ACCOUNT_PATH);
      break;

    case "MY_TRIPS":
      wixLocation.to(MY_TRIPS_PATH);
      break;

    default:
      console.warn("[SKANDI Club] Unknown modal message:", data);
  }
}

function getEl(selector) {
  try {
    return $w(selector);
  } catch (error) {
    return null;
  }
}

function isHtmlComponent(el) {
  return Boolean(
    el &&
    typeof el.postMessage === "function" &&
    typeof el.onMessage === "function"
  );
}

async function setModalVisible(visible) {
  const modal = getEl(CLUB_MODAL_ID);
  if (!modal) return;

  try {
    if (visible) {
      if (typeof modal.expand === "function") await modal.expand();
      if (typeof modal.show === "function") await modal.show();
    } else {
      if (typeof modal.hide === "function") await modal.hide();
      if (typeof modal.collapse === "function") await modal.collapse();
    }
  } catch (error) {
    console.warn("[SKANDI Club] Could not change modal visibility:", error);
  }
}

async function sendToModal(type, payload = {}) {
  const modal = getEl(CLUB_MODAL_ID);

  if (!modal) return false;

  if (typeof modal.postMessage !== "function") {
    console.error(
      `[SKANDI Club] Cannot send ${type}. ${CLUB_MODAL_ID} does not support postMessage(). ` +
      `Replace it with a Wix HTML Embed / HTML Component and set the ID to skandiClubAuthModal.`
    );
    return false;
  }

  try {
    modal.postMessage({
      source: "SKANDI_WIX_PARENT",
      type,
      payload,
      timestamp: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error(`[SKANDI Club] postMessage failed for ${type}:`, error);
    return false;
  }
}

export async function openClubModalFromCode() {
  await openClubModal();
}

async function openClubModal() {
  await setModalVisible(true);
  const status = await getMemberStatus();

  // Let the iframe finish rendering after expand/show.
  setTimeout(() => {
    sendToModal("OPEN", { status });
  }, 120);
}

async function closeClubModal() {
  await sendToModal("CLOSE", {});
  await setModalVisible(false);
}

async function postStatus() {
  const status = await getMemberStatus();
  await sendToModal("STATUS", { status });
}

async function openNativeAuth(mode) {
  try {
    await authentication.promptLogin({ mode });
    const status = await getMemberStatus();

    await setModalVisible(true);
    setTimeout(() => {
      sendToModal("OPEN", { status });
    }, 120);
  } catch (error) {
    // User may simply close the Wix login/signup modal.
    console.warn(`[SKANDI Club] ${mode} cancelled or failed:`, error);
  }
}

async function openForgotPassword() {
  try {
    await authentication.promptForgotPassword();
  } catch (error) {
    console.warn("[SKANDI Club] Password reset cancelled or failed:", error);
  }
}

async function getMemberStatus() {
  try {
    const member = await currentMember.getMember();

    if (!member) {
      return { loggedIn: false };
    }

    const firstName = member.contactDetails?.firstName || "";
    const lastName = member.contactDetails?.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();

    return {
      loggedIn: true,
      memberId: member._id,
      email: member.loginEmail || "",
      name: fullName || member.profile?.nickname || member.loginEmail || "SKANDI Club member",
    };
  } catch (error) {
    return { loggedIn: false };
  }
}