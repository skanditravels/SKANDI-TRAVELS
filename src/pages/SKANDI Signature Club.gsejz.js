import wixLocation from "wix-location";
import { authentication, currentMember } from "wix-members-frontend";
import { getSkandiClubPublicPayload } from "backend/CLUB/skandiClubPublic.web";

const EMBED_ID = "#skandiClubInfoEmbed";
const AUTH_MODAL_ID = "#skandiClubAuthModal";
const SOURCE = "SKANDI_CLUB_INFO";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

const PROFILE_PATH = "/my-profile";
const TERMS_PATH = "/legal/booking-terms";

function send(type, payload = {}) {
  $w(EMBED_ID).postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

async function sendPayload() {
  try {
    send("SKANDI_CLUB_INFO_DATA", await getSkandiClubPublicPayload());
    send("SKANDI_CLUB_MEMBER_STATUS", { status: await getMemberStatus() });
  } catch (error) {
    send("SKANDI_CLUB_INFO_ERROR", { message: "SKANDI Club information is temporarily unavailable." });
  }
}

function getEl(selector) {
  try { return $w(selector); } catch (error) { return null; }
}

function isHtmlComponent(el) {
  return Boolean(el && typeof el.postMessage === "function" && typeof el.onMessage === "function");
}

async function openAuth(mode = "signup") {
  const modal = getEl(AUTH_MODAL_ID);

  if (isHtmlComponent(modal)) {
    try {
      if (typeof modal.expand === "function") await modal.expand();
      if (typeof modal.show === "function") await modal.show();

      modal.postMessage({
        source: PARENT_SOURCE,
        type: "OPEN",
        payload: { mode, status: await getMemberStatus() },
        timestamp: new Date().toISOString()
      });
      return;
    } catch (err) {}
  }

  try {
    await authentication.promptLogin({ mode });
    wixLocation.to(PROFILE_PATH);
  } catch (error) {
    // Customer may close the native Wix auth modal.
  }
}

async function getMemberStatus() {
  try {
    const member = await currentMember.getMember();
    if (!member) return { loggedIn: false };

    const firstName = member.contactDetails?.firstName || "";
    const lastName = member.contactDetails?.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();

    return {
      loggedIn: true,
      memberId: member._id,
      contactId: member.contactId || "",
      email: member.loginEmail || "",
      name: fullName || member.profile?.nickname || member.loginEmail || "SKANDI Club member"
    };
  } catch (error) {
    return { loggedIn: false };
  }
}

$w.onReady(function () {
  const embed = $w(EMBED_ID);

  embed.onMessage(async (event) => {
    const message = event.data || {};
    if (message.source !== SOURCE) return;

    switch (message.type) {
      case "SKANDI_CLUB_INFO_READY":
      case "SKANDI_CLUB_INFO_REFRESH":
        await sendPayload();
        break;

      case "SKANDI_CLUB_AUTH_OPEN":
        await openAuth(message.payload?.mode || "signup");
        break;

      case "SKANDI_CLUB_PROFILE_OPEN":
        wixLocation.to(PROFILE_PATH);
        break;

      case "SKANDI_CLUB_TERMS_OPEN":
        wixLocation.to(TERMS_PATH);
        break;

      default:
        break;
    }
  });

  sendPayload();
});
