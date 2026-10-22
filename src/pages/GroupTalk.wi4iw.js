// /src/pages/GroupTalk.wi4iw.js
// SKANDI V12 GroupTalk: canonical page bridge with correlated LiveKit failure responses.
// GroupTalk's HTML embed remains the owner of the LiveKit room and local media tracks.
import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";
import { getStaffPortalSession } from "backend/SKANDI_CORE/staffAuth.web";
import {
  getGroupTalkBootstrap, getGroupTalkRealtimeConfig, updateGroupTalkPresence, getGroupTalkPresence,
  createLiveKitToken, triggerGroupTalkEvent, getPhoneBook, sendLocationPing, getLiveLocations,
  createGroupTalkTicket, getGroupTalkTickets, replyToGroupTalkTicket, searchGroupTalkHistory,
  adminSaveGroup, adminSetMembership, getTicketCategories, saveTicketCategory, deleteTicketCategory
} from "backend/SKANDI_CORE/groupTalk.web";

const EMBED = "#htmlGroupTalk";
const SOURCE = "GROUPTALK_HTML";
const PARENT = "SKANDI_WIX_PARENT";
const CHROME = "SKANDI_INTERNAL_CHROME";
const LOGIN_PATH = "/riaintra";
const HOME_PATH = "/";

function currentPath() {
  return "/" + wixLocation.path.join("/");
}

function post(html, type, payload = {}) {
  html.postMessage({ source: PARENT, type, payload, timestamp: new Date().toISOString() });
}

function allowed(path) {
  const p = String(path || "");
  return p === "/" || p === LOGIN_PATH || p.startsWith("/riaintra/") || p === "/altea" || p.startsWith("/altea/");
}

async function logout() {
  try { await authentication.logout(); } catch (_) {}
  wixLocation.to(HOME_PATH);
}

let bootstrapInFlight = null;
async function bootstrap(html) {
  if (bootstrapInFlight) return bootstrapInFlight;
  bootstrapInFlight = (async () => {
    const session = await getStaffPortalSession().catch(() => null);
    if (!session?.authorized) {
      wixLocation.to(LOGIN_PATH);
      return null;
    }
    const gt = await getGroupTalkBootstrap();
    post(html, "GT_BOOTSTRAP", gt);
    post(html, "INTERNAL_CHROME_BOOTSTRAP", {
      pageName: "GroupTalk",
      pagePath: currentPath(),
      pageSubtitle: "Employee-to-Ops requests, voice, radio, calls and live map",
      profile: gt.profile,
      apps: gt.apps || [],
      isAltea: true
    });
    return gt;
  })().finally(() => { bootstrapInFlight = null; });
  return bootstrapInFlight;
}

function reportError(html, type, requestId, error) {
  const failure = {
    requestId,
    ok: false,
    code: error?.code || "GROUPTALK_ACTION_FAILED",
    message: error?.message || "GroupTalk action failed."
  };
  console.error("[GroupTalk page]", type, error);
  // The HTML awaits this exact response for LiveKit and realtime configuration.
  // GT_ERROR alone cannot settle those promises, causing a 12-second timeout.
  if (type === "LIVEKIT_TOKEN_REQUEST") {
    post(html, "LIVEKIT_TOKEN_RESPONSE", failure);
  } else if (type === "REALTIME_CONFIG_REQUEST") {
    post(html, "REALTIME_CONFIG_RESPONSE", failure);
  } else {
    post(html, "GT_ERROR", { ...failure, action: type });
  }
}

$w.onReady(() => {
  const html = $w(EMBED);
  html.onMessage(async (event) => {
    const msg = event.data || {};
    const source = msg.source || "";
    const type = msg.type || msg.event || msg.action || "";
    const payload = msg.payload || {};
    const requestId = payload.requestId || "";
    try {
      if (source === CHROME) {
        if (type === "INTERNAL_CHROME_READY") { await bootstrap(html); return; }
        if (type === "INTERNAL_LOGOUT") { await logout(); return; }
        if (type === "INTERNAL_NAVIGATE") {
          const path = payload.path || msg.path;
          if (allowed(path)) wixLocation.to(path);
          return;
        }
      }
      if (source !== SOURCE) return;
      const send = async (outType, fn) => {
        const result = await fn(payload);
        post(html, outType, { requestId, ...result });
      };
      switch (type) {
        case "GT_READY":
        case "GT_REFRESH":
          await bootstrap(html);
          break;
        case "REALTIME_CONFIG_REQUEST": await send("REALTIME_CONFIG_RESPONSE", getGroupTalkRealtimeConfig); break;
        case "PRESENCE_UPDATE": await send("PRESENCE_UPDATE_RESPONSE", updateGroupTalkPresence); break;
        case "PRESENCE_REQUEST": await send("PRESENCE_RESPONSE", getGroupTalkPresence); break;
        case "LIVEKIT_TOKEN_REQUEST": await send("LIVEKIT_TOKEN_RESPONSE", createLiveKitToken); break;
        case "PTT_EVENT": await send("PTT_EVENT_RESULT", triggerGroupTalkEvent); break;
        case "PHONEBOOK_REQUEST": await send("PHONEBOOK_RESPONSE", getPhoneBook); break;
        case "LOCATION_PING": await send("LOCATION_PING_RESULT", sendLocationPing); break;
        case "LIVE_LOCATIONS_REQUEST": await send("LIVE_LOCATIONS_RESPONSE", getLiveLocations); break;
        case "TICKET_CREATE": await send("TICKET_CREATE_RESPONSE", createGroupTalkTicket); break;
        case "TICKET_LIST_REQUEST": await send("TICKET_LIST_RESPONSE", getGroupTalkTickets); break;
        case "TICKET_REPLY": await send("TICKET_REPLY_RESPONSE", replyToGroupTalkTicket); break;
        case "HISTORY_SEARCH_REQUEST": await send("HISTORY_SEARCH_RESPONSE", searchGroupTalkHistory); break;
        case "TICKET_CATEGORY_LIST_REQUEST": await send("TICKET_CATEGORY_LIST_RESPONSE", getTicketCategories); break;
        case "TICKET_CATEGORY_SAVE": await send("TICKET_CATEGORY_SAVE_RESPONSE", saveTicketCategory); break;
        case "TICKET_CATEGORY_DELETE": await send("TICKET_CATEGORY_DELETE_RESPONSE", deleteTicketCategory); break;
        case "ADMIN_SAVE_GROUP":
          await send("ADMIN_SAVE_GROUP_RESPONSE", adminSaveGroup);
          await bootstrap(html);
          break;
        case "ADMIN_SET_MEMBERSHIP":
          await send("ADMIN_SET_MEMBERSHIP_RESPONSE", adminSetMembership);
          await bootstrap(html);
          break;
        case "GT_NAVIGATE":
          if (allowed(payload.path)) wixLocation.to(payload.path);
          break;
        default:
          console.info("[GroupTalk] Unhandled message", type);
      }
    } catch (error) {
      reportError(html, type, requestId, error);
    }
  });
  bootstrap(html).catch(error => reportError(html, "GT_BOOTSTRAP", "", error));
});
