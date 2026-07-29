import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";
import { getStaffPortalSession } from "src/backend/RIA/staffPortalAuth.web";
import { runInternalGlobalSearch } from "src/backend/FINAL/internalChrome.web";
import {
  getMailBootstrap,
  listMailMessages,
  getMailMessage,
  sendMailMessage,
  saveMailDraft,
  updateMailUserState,
  getMailDirectory
} from "src/backend/MAIL/mail.web";

const EMBED = "#mailEmbed";
const EMBED_SOURCE = "SKANDI_MAIL_EMBED";
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

  const data = await getMailBootstrap();
  send(html, "MAIL_BOOTSTRAP", data);

  send(html, "INTERNAL_CHROME_BOOTSTRAP", {
    pageName: "Mail",
    pagePath: currentPath(),
    pageSubtitle: "Internal company mail",
    profile: data.profile,
    apps: data.apps || [],
    isAltea: false
  });
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
        case "MAIL_READY":
          await bootstrap(html);
          break;

        case "MAIL_LIST_REQUEST":
          send(html, "MAIL_LIST_RESPONSE", await listMailMessages(payload));
          break;

        case "MAIL_GET_REQUEST":
          send(html, "MAIL_GET_RESPONSE", await getMailMessage(payload));
          break;

        case "MAIL_SEND_REQUEST":
          send(html, "MAIL_SEND_RESPONSE", await sendMailMessage(payload));
          send(html, "MAIL_LIST_RESPONSE", await listMailMessages({ folder: payload.folder || "Inbox" }));
          break;

        case "MAIL_DRAFT_SAVE_REQUEST":
          send(html, "MAIL_DRAFT_SAVE_RESPONSE", await saveMailDraft(payload));
          break;

        case "MAIL_STATE_REQUEST":
          send(html, "MAIL_STATE_RESPONSE", await updateMailUserState(payload));
          send(html, "MAIL_LIST_RESPONSE", await listMailMessages({ folder: payload.folder || "Inbox" }));
          break;

        case "MAIL_DIRECTORY_REQUEST":
          send(html, "MAIL_DIRECTORY_RESPONSE", await getMailDirectory());
          break;

        case "MAIL_NAVIGATE":
          if (allowedPath(payload.path)) wixLocation.to(payload.path);
          break;

        default:
          console.log("Unhandled Mail message:", msg);
      }
    } catch (error) {
      console.error("Mail page-code error:", error);
      send(html, "MAIL_ERROR", { action: type, message: error.message || "Mail action failed." });
    }
  });
});
