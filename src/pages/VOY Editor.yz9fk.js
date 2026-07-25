import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";
import { runInternalGlobalSearch } from "backend/FINAL/internalChrome.web";
import {
  getNewsroomAdminBootstrap,
  listNewsroomAdminData,
  saveNewsroomCategory,
  saveNewsroomPost,
  publishNewsroomPost,
  archiveNewsroomPost,
  saveNewsroomMediaAsset,
  saveNewsroomPressContact
} from "backend/FINAL/newsService.web";

const EMBED_ID = "#newsroomAdminEmbed";
const EMBED_SOURCE = "SKANDI_NEWSROOM_CONTROL";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const CHROME_SOURCE = "SKANDI_INTERNAL_CHROME";
const LOGIN_PATH = "/riaintra";
const HOME_PATH = "/";

function currentPath() {
  return "/" + wixLocation.path.join("/");
}

function send(type, payload = {}) {
  $w(EMBED_ID).postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function allowedInternalPath(path) {
  const p = String(path || "");
  return p === "/" || p === LOGIN_PATH || p.startsWith("/riaintra") || p.startsWith("/altea");
}

async function logout() {
  try { await authentication.logout(); } catch (err) {}
  wixLocation.to(HOME_PATH);
}

async function bootstrap() {
  const portalSession = await getStaffPortalSession().catch(() => null);
  if (!portalSession || portalSession.authorized === false || portalSession.ok === false) {
    wixLocation.to(LOGIN_PATH);
    return;
  }

  const data = await getNewsroomAdminBootstrap();
  send("NEWSROOM_ADMIN_BOOTSTRAP", data);

  send("INTERNAL_CHROME_BOOTSTRAP", {
    pageName: "Newsroom Control",
    pagePath: currentPath(),
    pageSubtitle: "Public newsroom, press releases and media library",
    profile: data.profile || portalSession.profile || {},
    apps: data.apps || [],
    isAltea: false
  });
}

$w.onReady(function () {
  const embed = $w(EMBED_ID);

  embed.onMessage(async (event) => {
    const msg = event.data || {};
    const source = msg.source || "";
    const type = msg.type || "";
    const payload = msg.payload || {};

    try {
      if (source === CHROME_SOURCE) {
        if (type === "INTERNAL_CHROME_READY") {
          await bootstrap();
          return;
        }

        if (type === "INTERNAL_LOGOUT") {
          await logout();
          return;
        }

        if (type === "INTERNAL_NAVIGATE") {
          const path = payload.path || msg.path || "";
          if (allowedInternalPath(path)) wixLocation.to(path);
          return;
        }

        if (type === "INTERNAL_GLOBAL_SEARCH") {
          send("INTERNAL_SEARCH_RESULTS", await runInternalGlobalSearch(payload.query || ""));
          return;
        }
      }

      if (source && source !== EMBED_SOURCE) return;

      if (type === "NEWSROOM_ADMIN_READY") {
        await bootstrap();
        return;
      }

      if (type === "NEWSROOM_ADMIN_REFRESH") {
        send("NEWSROOM_ADMIN_DATA", await listNewsroomAdminData(payload));
        return;
      }

      if (type === "NEWSROOM_SAVE_CATEGORY") {
        const result = await saveNewsroomCategory(payload.item || {});
        if (!result.ok) throw new Error(result.error || "Category save failed.");
        send("NEWSROOM_ADMIN_SAVED", result);
        send("NEWSROOM_ADMIN_DATA", await listNewsroomAdminData({}));
        return;
      }

      if (type === "NEWSROOM_SAVE_POST") {
        const result = await saveNewsroomPost(payload.item || {});
        if (!result.ok) throw new Error(result.error || "Post save failed.");
        send("NEWSROOM_ADMIN_SAVED", result);
        send("NEWSROOM_ADMIN_DATA", await listNewsroomAdminData({}));
        return;
      }

      if (type === "NEWSROOM_PUBLISH_POST") {
        const result = await publishNewsroomPost(payload);
        if (!result.ok) throw new Error(result.error || "Post publish failed.");
        send("NEWSROOM_ADMIN_SAVED", result);
        send("NEWSROOM_ADMIN_DATA", await listNewsroomAdminData({}));
        return;
      }

      if (type === "NEWSROOM_ARCHIVE_POST") {
        const result = await archiveNewsroomPost(payload);
        if (!result.ok) throw new Error(result.error || "Post archive failed.");
        send("NEWSROOM_ADMIN_SAVED", result);
        send("NEWSROOM_ADMIN_DATA", await listNewsroomAdminData({}));
        return;
      }

      if (type === "NEWSROOM_SAVE_MEDIA") {
        const result = await saveNewsroomMediaAsset(payload.item || {});
        if (!result.ok) throw new Error(result.error || "Media save failed.");
        send("NEWSROOM_ADMIN_SAVED", result);
        send("NEWSROOM_ADMIN_DATA", await listNewsroomAdminData({}));
        return;
      }

      if (type === "NEWSROOM_SAVE_CONTACT") {
        const result = await saveNewsroomPressContact(payload.item || {});
        if (!result.ok) throw new Error(result.error || "Contact save failed.");
        send("NEWSROOM_ADMIN_SAVED", result);
        send("NEWSROOM_ADMIN_DATA", await listNewsroomAdminData({}));
        return;
      }

      if (type === "NEWSROOM_ADMIN_NAVIGATE") {
        if (allowedInternalPath(payload.path)) wixLocation.to(payload.path);
        return;
      }
    } catch (error) {
      send("NEWSROOM_ADMIN_ERROR", {
        message: error.message || "Newsroom Control action failed.",
        action: type
      });
    }
  });
});