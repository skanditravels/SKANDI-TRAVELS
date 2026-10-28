import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";
import { getStaffPortalSession } from "backend/SKANDI_CORE/staffAuth.web.js";
import {
  getMyRosterBootstrap,
  createTimeClockEvent,
  requestTimeOff,
  requestShiftChange
} from "backend/SKANDI_CORE/myRoster.web.js";

const EMBED = "#myRosterEmbed";
const EMBED_SOURCE = "SKANDI_MYROSTER_EMBED";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const CHROME_SOURCE = "SKANDI_INTERNAL_CHROME";
const LOGIN_PATH = "/riaintra";
let allowedAppPaths = new Set();
let authorizedApps = [];

function currentPath() {
  return "/" + wixLocation.path.join("/");
}
function send(html, type, payload) {
  html.postMessage({ source: PARENT_SOURCE, type, payload: payload || {}, timestamp: new Date().toISOString() });
}
function appPaths(apps) {
  return new Set((Array.isArray(apps) ? apps : []).map(app => String(app && app.path || "")).filter(Boolean));
}
async function logout() {
  try { await authentication.logout(); } catch (error) {}
  wixLocation.to(LOGIN_PATH);
}
async function bootstrap(html, filters) {
  const session = await getStaffPortalSession().catch(() => null);
  if (!session || session.authorized !== true || session.ok === false) {
    wixLocation.to(LOGIN_PATH);
    return;
  }
  const data = await getMyRosterBootstrap(filters || {});
  authorizedApps = Array.isArray(data.apps) ? data.apps : (Array.isArray(session.apps) ? session.apps : []);
  allowedAppPaths = appPaths(authorizedApps);
  send(html, "MYROSTER_BOOTSTRAP", data);
  send(html, "INTERNAL_CHROME_BOOTSTRAP", {
    pageName: "MyRoster",
    pagePath: currentPath(),
    pageSubtitle: "Destination staff schedule and requests",
    profile: data.profile,
    apps: authorizedApps,
    isAltea: false
  });
}
async function refresh(html, filters) {
  await bootstrap(html, filters);
}
$w.onReady(function () {
  const html = $w(EMBED);
  html.onMessage(async event => {
    const msg = event.data || {};
    const payload = msg.payload || {};
    const type = msg.type || msg.event || "";
    try {
      if (msg.source === CHROME_SOURCE) {
        if (type === "INTERNAL_CHROME_READY") { await bootstrap(html, {}); return; }
        if (type === "INTERNAL_LOGOUT") { await logout(); return; }
        if (type === "INTERNAL_NAVIGATE") {
          const target = String(payload.path || msg.path || "");
          if (allowedAppPaths.has(target)) wixLocation.to(target);
          return;
        }
        if (type === "INTERNAL_GLOBAL_SEARCH") {
          const query = String(payload.query || "").trim().toLowerCase().slice(0, 300);
          const results = query ? authorizedApps.filter(app => [app.title, app.description || app.subtitle, app.id, app.code].join(" ").toLowerCase().includes(query)).slice(0, 25).map(app => ({
            id: String(app.id || "").slice(0, 120),
            title: String(app.title || "").slice(0, 200),
            type: "APP",
            path: String(app.path || "").slice(0, 500),
            summary: String(app.description || app.subtitle || "").slice(0, 500)
          })) : [];
          send(html, "INTERNAL_SEARCH_RESULTS", { results, items: results, query });
          return;
        }
        return;
      }
      if (msg.source !== EMBED_SOURCE) return;
      if (type === "MYROSTER_READY") {
        await bootstrap(html, payload);
        return;
      }
      if (type === "MYROSTER_REFRESH_REQUEST") {
        await refresh(html, payload);
        return;
      }
      if (type === "MYROSTER_CLOCK_EVENT_REQUEST") {
        const result = await createTimeClockEvent(payload);
        send(html, "MYROSTER_ACTION_OK", Object.assign({}, result, { requestId: payload.requestId }));
        await refresh(html, payload);
        return;
      }
      if (type === "MYROSTER_TIMEOFF_REQUEST") {
        const result = await requestTimeOff(payload);
        send(html, "MYROSTER_ACTION_OK", Object.assign({}, result, { requestId: payload.requestId }));
        await refresh(html, payload);
        return;
      }
      if (type === "MYROSTER_SHIFT_CHANGE_REQUEST") {
        const result = await requestShiftChange(payload);
        send(html, "MYROSTER_ACTION_OK", Object.assign({}, result, { requestId: payload.requestId }));
        await refresh(html, payload);
        return;
      }
      if (type === "MYROSTER_LOGOUT") {
        await logout();
        return;
      }
      if (type === "MYROSTER_NAVIGATE") {
        const target = String(payload.path || "");
        if (allowedAppPaths.has(target)) wixLocation.to(target);
      }
    } catch (error) {
      console.error("MyRoster staff request failed:", error);
      send(html, "MYROSTER_ERROR", {
        code: String(error && (error.code || error.message) || "MYROSTER_FAILED"),
        message: String(error && (error.publicMessage || error.message) || "MyRoster request failed."),
        requestId: payload.requestId || ""
      });
    }
  });
});
