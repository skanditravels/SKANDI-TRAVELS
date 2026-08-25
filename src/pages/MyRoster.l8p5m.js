import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";
import { runInternalGlobalSearch } from "backend/FINAL/internalChrome.web";
import {
  getMyRosterBootstrap,
  getMyRosterBoard,
  syncOperationalDutiesFromAltea,
  publishRosterWindow,
  createTimeClockEvent,
  requestTimeOff,
  createRosterBid,
  createTripTradeDrop,
  requestTripTradePickup,
  createPayrollRosterExport
} from "backend/ROSTER/myRoster.web";

const EMBED = "#myRosterEmbed";
const EMBED_SOURCE = "SKANDI_MYROSTER_EMBED";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const CHROME_SOURCE = "SKANDI_INTERNAL_CHROME";
const LOGIN_PATH = "/riaintra";
const HOME_PATH = "/";

function currentPath() {
  return "/" + wixLocation.path.join("/");
}

function send(html, type, payload = {}) {
  html.postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() });
}

function allowedPath(path) {
  const p = String(path || "");
  return p === "/" || p === LOGIN_PATH || p.startsWith("/riaintra") || p.startsWith("/altea");
}

async function logout() {
  try { await authentication.logout(); } catch (err) {}
  wixLocation.to(HOME_PATH);
}

async function bootstrap(html) {
  const session = await getStaffPortalSession().catch(() => null);
  if (!session || session.authorized === false || session.ok === false) {
    wixLocation.to(LOGIN_PATH);
    return;
  }

  const data = await getMyRosterBootstrap({ path: currentPath() });
  send(html, "MYROSTER_BOOTSTRAP", data);

  send(html, "INTERNAL_CHROME_BOOTSTRAP", {
    pageName: "MyRoster",
    pagePath: currentPath(),
    pageSubtitle: "Staff scheduling, legality, TripTrade and time clock",
    profile: data.profile,
    apps: data.apps || [],
    isAltea: false
  });
}

async function refresh(html, filters = {}) {
  const data = await getMyRosterBoard(filters);
  send(html, "MYROSTER_BOOTSTRAP", data);
}

$w.onReady(function () {
  const html = $w(EMBED);

  html.onMessage(async (event) => {
    const msg = event.data || {};
    const source = msg.source || "";
    const type = msg.type || msg.event || "";
    const payload = msg.payload || {};

    try {
      if (source === CHROME_SOURCE) {
        if (type === "INTERNAL_CHROME_READY") {
          await bootstrap(html);
          return;
        }

        if (type === "INTERNAL_LOGOUT") {
          await logout();
          return;
        }

        if (type === "INTERNAL_NAVIGATE") {
          const path = payload.path || msg.path;
          if (allowedPath(path)) wixLocation.to(path);
          return;
        }

        if (type === "INTERNAL_GLOBAL_SEARCH") {
          const result = await runInternalGlobalSearch(payload.query || "");
          send(html, "INTERNAL_SEARCH_RESULTS", result);
          return;
        }
      }

      if (source !== EMBED_SOURCE) return;

      switch (type) {
        case "MYROSTER_READY":
          await bootstrap(html);
          break;

        case "MYROSTER_REFRESH_REQUEST":
          await refresh(html, payload);
          break;

        case "MYROSTER_SYNC_ALTEA_REQUEST":
          send(html, "MYROSTER_ACTION_OK", await syncOperationalDutiesFromAltea(payload));
          await refresh(html, payload);
          break;

        case "MYROSTER_PUBLISH_REQUEST":
          send(html, "MYROSTER_ACTION_OK", await publishRosterWindow(payload));
          await refresh(html, payload);
          break;

        case "MYROSTER_CLOCK_EVENT_REQUEST":
          send(html, "MYROSTER_ACTION_OK", await createTimeClockEvent(payload));
          await refresh(html, payload);
          break;

        case "MYROSTER_TIMEOFF_REQUEST":
          send(html, "MYROSTER_ACTION_OK", await requestTimeOff(payload));
          await refresh(html, payload);
          break;

        case "MYROSTER_BID_REQUEST":
          send(html, "MYROSTER_ACTION_OK", await createRosterBid(payload));
          await refresh(html, payload);
          break;

        case "MYROSTER_TRIPTRADE_DROP_REQUEST":
          send(html, "MYROSTER_ACTION_OK", await createTripTradeDrop(payload));
          await refresh(html, payload);
          break;

        case "MYROSTER_TRIPTRADE_PICKUP_REQUEST":
          send(html, "MYROSTER_ACTION_OK", await requestTripTradePickup(payload));
          await refresh(html, payload);
          break;

        case "MYROSTER_PAYROLL_EXPORT_REQUEST":
          send(html, "MYROSTER_ACTION_OK", await createPayrollRosterExport(payload));
          break;

        case "MYROSTER_NAVIGATE":
          if (allowedPath(payload.path)) wixLocation.to(payload.path);
          break;

        default:
          console.log("Unhandled MyRoster message:", msg);
      }
    } catch (error) {
      console.error("MyRoster page-code error:", error);
      send(html, "MYROSTER_ERROR", { message: error.message || "Roster action failed.", action: type });
    }
  });
});
