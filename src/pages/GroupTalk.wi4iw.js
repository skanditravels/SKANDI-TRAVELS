import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";
import {
  getGroupTalkBootstrap,
  authorizePusherChannel,
  createLiveKitToken,
  triggerGroupTalkEvent,
  getPhoneBook,
  sendLocationPing,
  getLiveLocations,
  createGroupTalkTicket,
  getGroupTalkTickets,
  replyToGroupTalkTicket,
  searchGroupTalkHistory,
  adminSaveGroup,
  adminSetMembership,
  getTicketCategories,
  saveTicketCategory,
  deleteTicketCategory
} from "backend/GROUPTALK/grouptalk.web";
import { bindInternalHtmlBridge } from 'public/internalHtmlBridge';
import {
  getHrSession,
  listStaff,
  saveStaff,
  setStaffActive,
  generateSkId,
  printStaffBadge,
  getStaffHrReports,
} from 'backend/RIA/staffHR.web';
import {
  savePayrollProfile,
  createPayrollPeriod,
  calculatePayrollRun,
  finalizePayrollRun,
} from 'backend/RIA/staffPayroll.web';

const HR_TYPES = new Set([
  'HR_READY', 'HR_REFRESH', 'HR_SAVE_STAFF', 'HR_DEACTIVATE', 'HR_REACTIVATE',
  'HR_GENERATE_SKID', 'HR_PRINT_BADGE', 'HR_REPORTS_REQUEST',
  'PAYROLL_SAVE_PROFILE', 'PAYROLL_CREATE_PERIOD', 'PAYROLL_CALCULATE_RUN', 'PAYROLL_FINALIZE_RUN',
  // Keep the existing handlers for HR_WIX_*, HR_PORTAL_*, Crewcontrol, and Badge Control.
]);

$w.onReady(() => {
  bindInternalHtmlBridge({
    embed: $w('#staffHrEmbed'),
    allowedSources: new Set(['SKANDI_HR_STAFF', 'SKANDI_CAREERS_CONTROL']),
    allowedTypes: HR_TYPES,
    toError: () => ({ type: 'HR_ERROR', payload: { code: 'ACTION_FAILED' } }),
    handle: async ({ type, payload }) => {
      switch (type) {
        case 'HR_READY':
        case 'HR_REFRESH': {
          const [session, staff] = await Promise.all([getHrSession(), listStaff(payload)]);
          return [
            { type: 'HR_SESSION', payload: session },
            { type: 'HR_STAFF_LIST', payload: { staff } },
          ];
        }
        case 'HR_SAVE_STAFF':
          return { type: 'HR_STAFF_SAVED', payload: await saveStaff(payload) };
        case 'HR_DEACTIVATE':
          return { type: 'HR_ACTION_OK', payload: await setStaffActive({ ...payload, active: false }) };
        case 'HR_REACTIVATE':
          return { type: 'HR_ACTION_OK', payload: await setStaffActive({ ...payload, active: true }) };
        case 'HR_GENERATE_SKID':
          return { type: 'HR_SKID_GENERATED', payload: await generateSkId(payload) };
        case 'HR_PRINT_BADGE':
          return { type: 'HR_BADGE_PRINTED', payload: await printStaffBadge(payload) };
        case 'HR_REPORTS_REQUEST':
          return { type: 'HR_REPORTS', payload: await getStaffHrReports(payload) };
        case 'PAYROLL_SAVE_PROFILE':
          return { type: 'PAYROLL_PROFILE_SAVED', payload: await savePayrollProfile(payload) };
        case 'PAYROLL_CREATE_PERIOD':
          return { type: 'PAYROLL_PERIOD_CREATED', payload: await createPayrollPeriod(payload) };
        case 'PAYROLL_CALCULATE_RUN':
          return { type: 'PAYROLL_RUN_CALCULATED', payload: await calculatePayrollRun(payload) };
        case 'PAYROLL_FINALIZE_RUN':
          return { type: 'PAYROLL_RUN_FINALIZED', payload: await finalizePayrollRun(payload) };
        default:
          return { type: 'HR_ERROR', payload: { code: 'UNHANDLED_EVENT' } };
      }
    },
  });
});
const EMBED = "#htmlGroupTalk";
const GROUPTALK_SOURCE = "GROUPTALK_HTML";
const CHROME_SOURCE = "SKANDI_INTERNAL_CHROME";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const LOGIN_PATH = "/riaintra";
const HOME_PATH = "/";

function currentPath() {
  return "/" + wixLocation.path.join("/");
}

function post(html, type, payload = {}) {
  html.postMessage({
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

async function doLogout() {
  try {
    await authentication.logout();
  } catch (err) {
    console.warn("Logout warning:", err);
  }
  wixLocation.to(HOME_PATH);
}

async function bootstrap(html) {
  const session = await getStaffPortalSession().catch(() => null);
  if (!session || session.authorized === false || session.ok === false) {
    wixLocation.to(LOGIN_PATH);
    return;
  }

  const gt = await getGroupTalkBootstrap();
  post(html, "GT_BOOTSTRAP", gt);

  post(html, "INTERNAL_CHROME_BOOTSTRAP", {
    pageName: "GroupTalk",
    pagePath: currentPath(),
    pageSubtitle: "ALTEA live operations voice, map and helpdesk",
    profile: gt.profile,
    apps: gt.apps || [],
    isAltea: true
  });
}

$w.onReady(function () {
  const html = $w(EMBED);

  html.onMessage(async (event) => {
    const msg = event.data || {};
    const source = msg.source || "";
    const type = msg.type || msg.event || msg.action || "";
    const payload = msg.payload || {};

    try {
      if (source === CHROME_SOURCE) {
        if (type === "INTERNAL_CHROME_READY") {
          await bootstrap(html);
          return;
        }

        if (type === "INTERNAL_LOGOUT") {
          await doLogout();
          return;
        }

        if (type === "INTERNAL_NAVIGATE") {
          const path = payload.path || msg.path;
          if (allowedInternalPath(path)) wixLocation.to(path);
          return;
        }

        if (type === "INTERNAL_GLOBAL_SEARCH") {
          const query = payload.query || msg.query || "";
          const result = await runInternalGlobalSearch(query);
          post(html, "INTERNAL_SEARCH_RESULTS", {
            requestId: payload.requestId || msg.requestId || "",
            query,
            results: result.results || result.items || []
          });
          return;
        }
      }

      if (source !== GROUPTALK_SOURCE) return;

      switch (type) {
        case "GT_READY":
          await bootstrap(html);
          break;

        case "PUSHER_AUTHORIZE": {
          const auth = await authorizePusherChannel(payload);
          post(html, "PUSHER_AUTH_RESPONSE", {
            requestId: payload.requestId,
            ok: true,
            auth
          });
          break;
        }

        case "LIVEKIT_TOKEN_REQUEST": {
          const token = await createLiveKitToken(payload);
          post(html, "LIVEKIT_TOKEN_RESPONSE", {
            requestId: payload.requestId,
            ok: true,
            ...token
          });
          break;
        }

        case "PTT_EVENT": {
          const result = await triggerGroupTalkEvent(payload);
          post(html, "PTT_EVENT_RESULT", {
            requestId: payload.requestId,
            ok: true,
            ...result
          });
          break;
        }

        case "PHONEBOOK_REQUEST": {
          const result = await getPhoneBook(payload);
          post(html, "PHONEBOOK_RESPONSE", result);
          break;
        }

        case "LOCATION_PING": {
          const result = await sendLocationPing(payload);
          post(html, "LOCATION_PING_RESULT", result);
          break;
        }

        case "LIVE_LOCATIONS_REQUEST": {
          const result = await getLiveLocations(payload);
          post(html, "LIVE_LOCATIONS_RESPONSE", result);
          break;
        }

        case "TICKET_CREATE": {
          const result = await createGroupTalkTicket(payload);
          post(html, "TICKET_CREATE_RESPONSE", result);
          break;
        }

        case "TICKET_LIST_REQUEST": {
          const result = await getGroupTalkTickets(payload);
          post(html, "TICKET_LIST_RESPONSE", result);
          break;
        }

        case "TICKET_REPLY": {
          const result = await replyToGroupTalkTicket(payload);
          post(html, "TICKET_REPLY_RESPONSE", result);
          break;
        }

        case "HISTORY_SEARCH_REQUEST": {
          const result = await searchGroupTalkHistory(payload);
          post(html, "HISTORY_SEARCH_RESPONSE", {
            requestId: payload.requestId,
            ...result
          });
          break;
        }
        case "TICKET_CATEGORY_LIST_REQUEST": {
  const result = await getTicketCategories(payload);
  post(html, "TICKET_CATEGORY_LIST_RESPONSE", result);
  break;
}

case "TICKET_CATEGORY_SAVE": {
  const result = await saveTicketCategory(payload);
  post(html, "TICKET_CATEGORY_SAVE_RESPONSE", result);
  break;
}

case "TICKET_CATEGORY_DELETE": {
  const result = await deleteTicketCategory(payload);
  post(html, "TICKET_CATEGORY_DELETE_RESPONSE", result);
  break;
}
        case "ADMIN_SAVE_GROUP": {
          const result = await adminSaveGroup(payload);
          post(html, "ADMIN_SAVE_GROUP_RESPONSE", result);
          await bootstrap(html);
          break;
        }

        case "ADMIN_SET_MEMBERSHIP": {
          const result = await adminSetMembership(payload);
          post(html, "ADMIN_SET_MEMBERSHIP_RESPONSE", result);
          break;
        }

        case "GT_NAVIGATE": {
          const path = payload.path || "";
          if (allowedInternalPath(path)) wixLocation.to(path);
          break;
        }

        default:
          console.log("Unhandled GroupTalk message:", msg);
      }
    } catch (err) {
      console.error("GroupTalk page-code error:", err);
      post(html, "GT_ERROR", {
        requestId: payload.requestId || "",
        action: type,
        message: err.message || "GroupTalk action failed."
      });
    }
  });
});