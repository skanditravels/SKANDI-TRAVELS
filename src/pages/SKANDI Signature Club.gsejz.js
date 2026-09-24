// /src/pages/SKANDI Signature Club.gsejz.js
// SKANDI Club — B-011.1 public page bridge.
// Route: /skandi-club
// HTML Component: #skandiClubInfoEmbed

import wixLocationFrontend from "wix-location-frontend";
import { authentication, currentMember } from "wix-members-frontend";
import { getSkandiClubPublicPayload } from "backend/SKANDI_CORE/clubPublic.web";
import { SITE_MAP, APP_ROUTES, isSafeInternalRoute } from "public/siteMap";

const EMBED_ID = "#skandiClubInfoEmbed";
const SOURCE = "SKANDI_CLUB_INFO";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const VERSION = "B-011.1";

const PROFILE_PATH = APP_ROUTES.myProfile;
const TERMS_PATH = `${SITE_MAP.policies}?slug=booking-terms`;

let embed = null;
let publicPayload = null;

function parseMessage(value) {
  if (typeof value === "string") {
    try { return JSON.parse(value); }
    catch (_) { return null; }
  }
  return value && typeof value === "object" ? value : null;
}

function send(type, payload = {}) {
  if (!embed) return;
  embed.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function setEmbedHeight(value) {
  const height = Number(value || 0);
  if (!embed || !Number.isFinite(height) || height <= 0) return;
  embed.height = Math.max(760, Math.min(30000, Math.ceil(height)));
}

async function getMemberStatus() {
  try {
    const member = await currentMember.getMember();
    if (!member?._id) return { loggedIn: false };

    const firstName = String(member.contactDetails?.firstName || "").trim();
    const lastName = String(member.contactDetails?.lastName || "").trim();
    const fullName = [firstName, lastName].filter(Boolean).join(" ");

    return {
      loggedIn: true,
      memberId: member._id,
      email: String(member.loginEmail || "").trim(),
      name:
        fullName ||
        String(member.profile?.nickname || "").trim() ||
        String(member.loginEmail || "").trim() ||
        "SKANDI Club member"
    };
  } catch (_) {
    return { loggedIn: false };
  }
}

async function sendPayload(force = false) {
  try {
    if (!publicPayload || force) {
      publicPayload = await getSkandiClubPublicPayload();
    }

    send("SKANDI_CLUB_INFO_DATA", publicPayload);
    send("SKANDI_CLUB_MEMBER_STATUS", {
      status: await getMemberStatus(),
      profilePath: PROFILE_PATH
    });
  } catch (error) {
    console.error("[SKANDI Club B-011.1] load failed", error);
    send("SKANDI_CLUB_INFO_ERROR", {
      message: "SKANDI Club information is temporarily unavailable."
    });
  }
}

async function openAuth(mode = "signup") {
  try {
    await authentication.promptLogin({ mode });
    await sendPayload(true);
    wixLocationFrontend.to(PROFILE_PATH);
  } catch (_) {
    // The customer may close the Wix authentication flow.
  }
}

function navigate(path) {
  const target = String(path || "").trim();
  if (target && isSafeInternalRoute(target)) {
    wixLocationFrontend.to(target);
  }
}

$w.onReady(() => {
  try {
    embed = $w(EMBED_ID);
  } catch (error) {
    console.error(`[SKANDI Club B-011.1] Missing ${EMBED_ID}.`, error);
    return;
  }

  if (!embed || typeof embed.onMessage !== "function" || typeof embed.postMessage !== "function") {
    console.error(`[SKANDI Club B-011.1] ${EMBED_ID} is not a compatible HTML Component.`);
    return;
  }

  embed.onMessage(async event => {
    const message = parseMessage(event?.data);
    if (!message || (message.source && message.source !== SOURCE)) return;

    const payload =
      message.payload && typeof message.payload === "object"
        ? message.payload
        : {};

    switch (message.type) {
      case "SKANDI_CLUB_INFO_READY":
        await sendPayload(false);
        return;

      case "SKANDI_CLUB_INFO_REFRESH":
        await sendPayload(true);
        return;

      case "SKANDI_CLUB_AUTH_OPEN":
        await openAuth(payload.mode || "signup");
        return;

      case "SKANDI_CLUB_PROFILE_OPEN":
        navigate(PROFILE_PATH);
        return;

      case "SKANDI_CLUB_TERMS_OPEN":
        navigate(TERMS_PATH);
        return;

      case "SKANDI_CLUB_NAVIGATE":
        navigate(payload.path);
        return;

      case "SKANDI_CLUB_HEIGHT":
        setEmbedHeight(payload.height);
        return;

      default:
        return;
    }
  });

  send("SKANDI_CLUB_PARENT_READY", {
    version: VERSION,
    route: SITE_MAP.club,
    profilePath: PROFILE_PATH
  });

  void sendPayload(false);
});
