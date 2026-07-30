// pages/staff-portal-intranet-with-chrome.js
// Page URL: /riaintra/staff-portal
// Dashboard HTML Embed ID: #staffDashboardEmbed
// Global Staff Chrome HTML Embed ID: #staffInternalChromeEmbed

import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";
import {
  getIntranetHomeData,
  updateMyEmployeeProfile,
  searchColleagues
} from "backend/RIA/staffIntranet.web";
import { runInternalGlobalSearch } from "backend/FINAL/internalChrome.web";

const DASHBOARD_EMBED_ID = "#staffDashboardEmbed";
const CHROME_EMBED_ID = "#staffInternalChromeEmbed";

const STAFF_LOGIN_PATH = "/riaintra";
const HOME_PATH = "/";

const ALLOWED_PATH_PREFIXES = [
  "/riaintra",
  "/altea"
];

let lastChromeProfile = {};
let lastChromeApps = [];
let dashboardHtml;
let chromeHtml;

$w.onReady(function () {
  dashboardHtml = $w(DASHBOARD_EMBED_ID);
  chromeHtml = $w(CHROME_EMBED_ID);

  dashboardHtml.onMessage(async (event) => {
    await handleMessage(event);
  });

  chromeHtml.onMessage(async (event) => {
    await handleMessage(event);
  });
});

async function handleMessage(event) {
  const msg = event.data || {};
  const payload = msg.payload || {};

  try {
    if (msg.source === "SKANDI_INTERNAL_CHROME") {
      await handleInternalChrome(msg, payload);
      return;
    }

    if (msg.source === "SKANDI_STAFF_DASHBOARD_INTRANET") {
      if (msg.type === "INTRANET_READY" || msg.type === "INTRANET_REFRESH") {
        await bootstrap();
        return;
      }

      if (msg.type === "INTRANET_NAVIGATE") {
        openStaffPath(String(payload.path || "").trim());
        return;
      }

      if (msg.type === "INTRANET_SAVE_PROFILE") {
        const result = await updateMyEmployeeProfile(payload.profile || {});
        post(dashboardHtml, "INTRANET_PROFILE_SAVED", result);
        return;
      }

      if (msg.type === "INTRANET_SEARCH_COLLEAGUES") {
        const result = await searchColleagues(payload.query || "");
        post(dashboardHtml, "INTRANET_COLLEAGUES", result);
        return;
      }

      if (msg.type === "STAFF_SIGNOUT_REQUEST") {
        await signOutHome();
        return;
      }
    }

    if (msg.source === "SKANDI_STAFF_DASHBOARD") {
      if (msg.type === "STAFF_DASHBOARD_READY") {
        const session = await getStaffPortalSession();

        if (!session.loggedIn || !session.authorized) {
          post(dashboardHtml, "STAFF_DASHBOARD_SESSION", session);
          wixLocation.to(STAFF_LOGIN_PATH);
          return;
        }

        post(dashboardHtml, "STAFF_DASHBOARD_SESSION", session);
        return;
      }

      if (msg.type === "STAFF_DASHBOARD_UNAUTHORIZED") {
        wixLocation.to(STAFF_LOGIN_PATH);
        return;
      }

      if (msg.type === "STAFF_OPEN_APP") {
        openStaffPath(String(payload.path || "").trim());
        return;
      }

      if (msg.type === "STAFF_SIGNOUT_REQUEST") {
        await signOutHome();
        return;
      }
    }
  } catch (err) {
    post(dashboardHtml, "INTRANET_ERROR", { message: cleanError(err) });
    post(dashboardHtml, "STAFF_DASHBOARD_ERROR", { message: cleanError(err) });
    post(chromeHtml, "INTERNAL_SEARCH_RESULTS", { results: [] });
  }
}

async function bootstrap() {
  const session = await getStaffPortalSession();

  if (!session.loggedIn || !session.authorized) {
    wixLocation.to(STAFF_LOGIN_PATH);
    return;
  }

  const data = await getIntranetHomeData();

  lastChromeProfile = data.profile || session.staff || session.profile || {};
  lastChromeApps = data.apps || session.apps || [];

  sendChrome("RIAINTRA Dashboard", lastChromeProfile, lastChromeApps);

  post(dashboardHtml, "INTRANET_BOOTSTRAP", {
    profile: data.profile,
    apps: lastChromeApps,
    news: data.news || [],
    stats: data.stats || {}
  });
}

async function handleInternalChrome(msg, payload = {}) {
  if (msg.type === "INTERNAL_CHROME_READY") {
    sendChrome("RIAINTRA Dashboard", lastChromeProfile, lastChromeApps);
    return;
  }

  if (msg.type === "INTERNAL_NAVIGATE") {
    openStaffPath(String(payload.path || "").trim());
    return;
  }

  if (msg.type === "INTERNAL_LOGOUT") {
    await signOutHome();
    return;
  }

  if (msg.type === "INTERNAL_GLOBAL_SEARCH") {
    const result = await runInternalGlobalSearch(payload.query || "");
    post(chromeHtml, "INTERNAL_SEARCH_RESULTS", result);
  }
}

function sendChrome(pageName, profile = {}, apps = []) {
  post(chromeHtml, "INTERNAL_CHROME_BOOTSTRAP", {
    pageName,
    pagePath: "/" + wixLocation.path.join("/"),
    pageSubtitle: "SKANDI internal staff system",
    profile,
    apps,
    isAltea: wixLocation.path.join("/").includes("altea")
  });
}

function openStaffPath(path) {
  if (!path) throw new Error("Missing staff destination.");

  const isAllowed = ALLOWED_PATH_PREFIXES.some((prefix) =>
    path === prefix || path.startsWith(`${prefix}/`)
  );

  if (!isAllowed) throw new Error("Invalid staff destination.");

  wixLocation.to(path);
}

async function signOutHome() {
  await authentication.logout();
  wixLocation.to(HOME_PATH);
}

function post(html, type, payload = {}) {
  if (!html) return;

  html.postMessage({
    source: "SKANDI_WIX_PARENT",
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function cleanError(err) {
  const msg = String(err?.message || err || "").trim();
  if (!msg) return "Something went wrong.";
  if (msg.length > 220) return "Something went wrong. Check site monitoring logs.";
  return msg;
}
