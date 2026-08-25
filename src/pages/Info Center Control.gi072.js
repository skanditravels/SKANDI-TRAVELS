import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";
import { runInternalGlobalSearch } from "backend/FINAL/internalChrome.web";
import {
  getHelpCenterAdminData,
  saveHelpCenterGroup,
  saveHelpCenterTopic,
  archiveHelpCenterGroup,
  archiveHelpCenterTopic
} from "backend/AMADEUS/helpCenterAdminService";

const HTML_ID = "#helpCenterAdminHtml";
const EMBED_SOURCE = "SKANDI_HELP_DATA_CONTROLLER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const CHROME_SOURCE = "SKANDI_INTERNAL_CHROME";
const LOGIN_PATH = "/riaintra";
const HOME_PATH = "/";

function currentPath() {
  return "/" + wixLocation.path.join("/");
}

function post(html, type, payload = {}) {
  html.postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() });
}

function allowedInternalPath(path) {
  const p = String(path || "");
  return p === "/" || p === LOGIN_PATH || p.startsWith("/riaintra") || p.startsWith("/altea");
}

async function logout() {
  try { await authentication.logout(); } catch (err) {}
  wixLocation.to(HOME_PATH);
}

async function loadData(html) {
  const session = await getStaffPortalSession().catch(() => null);
  if (!session || session.authorized === false || session.ok === false) {
    wixLocation.to(LOGIN_PATH);
    return;
  }

  const data = await getHelpCenterAdminData();

  if (!data.ok) {
    post(html, "HC_ADMIN_ERROR", { message: data.error || "Unable to load Help Center records." });
    return;
  }

  post(html, "HC_ADMIN_DATA", {
    groups: data.groups || [],
    topics: data.topics || [],
    access: data.access || {}
  });

  post(html, "INTERNAL_CHROME_BOOTSTRAP", {
    pageName: "Help Data Controller",
    pagePath: currentPath(),
    pageSubtitle: "ALTEA Help Center content records",
    profile: data.access?.profile || session.profile || {},
    apps: data.apps || [],
    isAltea: true
  });
}

$w.onReady(function () {
  const html = $w(HTML_ID);

  html.onMessage(async (event) => {
    const message = event.data || {};
    const source = message.source || "";
    const type = message.type || "";
    const payload = message.payload || message;

    try {
      if (source === CHROME_SOURCE) {
        if (type === "INTERNAL_CHROME_READY") {
          await loadData(html);
          return;
        }

        if (type === "INTERNAL_LOGOUT") {
          await logout();
          return;
        }

        if (type === "INTERNAL_NAVIGATE") {
          const path = payload.path || message.path;
          if (allowedInternalPath(path)) wixLocation.to(path);
          return;
        }

        if (type === "INTERNAL_GLOBAL_SEARCH") {
          const result = await runInternalGlobalSearch(payload.query || "");
          post(html, "INTERNAL_SEARCH_RESULTS", result);
          return;
        }
      }

      // Accept both new source-protected messages and older prototype messages with no source.
      if (source && source !== EMBED_SOURCE) return;

      if (type === "HC_ADMIN_READY" || type === "HC_ADMIN_REFRESH") {
        await loadData(html);
        return;
      }

      if (type === "HC_SAVE_GROUP") {
        const result = await saveHelpCenterGroup(payload.payload || payload || {});
        if (!result.ok) {
          post(html, "HC_ADMIN_ERROR", { message: result.error || "Group save failed." });
          return;
        }

        await loadData(html);
        post(html, "HC_ADMIN_SAVED", { message: "Group saved." });
        return;
      }

      if (type === "HC_SAVE_TOPIC") {
        const result = await saveHelpCenterTopic(payload.payload || payload || {});
        if (!result.ok) {
          post(html, "HC_ADMIN_ERROR", { message: result.error || "Topic save failed." });
          return;
        }

        await loadData(html);
        post(html, "HC_ADMIN_SAVED", { message: "Topic saved." });
        return;
      }

      if (type === "HC_ARCHIVE_GROUP") {
        const result = await archiveHelpCenterGroup(payload.itemId || message.itemId);
        if (!result.ok) {
          post(html, "HC_ADMIN_ERROR", { message: result.error || "Group archive failed." });
          return;
        }

        await loadData(html);
        post(html, "HC_ADMIN_SAVED", { message: "Group archived." });
        return;
      }

      if (type === "HC_ARCHIVE_TOPIC") {
        const result = await archiveHelpCenterTopic(payload.itemId || message.itemId);
        if (!result.ok) {
          post(html, "HC_ADMIN_ERROR", { message: result.error || "Topic archive failed." });
          return;
        }

        await loadData(html);
        post(html, "HC_ADMIN_SAVED", { message: "Topic archived." });
        return;
      }

      if (type === "HC_NAVIGATE") {
        const path = payload.path || "";
        if (allowedInternalPath(path)) wixLocation.to(path);
        return;
      }
    } catch (error) {
      post(html, "HC_ADMIN_ERROR", {
        message: error.message || String(error) || "Action failed."
      });
    }
  });

  loadData(html);
});
