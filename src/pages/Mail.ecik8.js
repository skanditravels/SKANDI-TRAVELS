// /src/pages/Mail.js
// Route: /riaintra/mail
// Embed: #mailEmbed
// R-003.9 canonical RIA Mail page bridge.

import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";
import { runInternalGlobalSearch } from "backend/internalChrome.web";
import {
  getMailBootstrap,
  listMailMessages,
  getMailMessage,
  sendMailMessage,
  saveMailDraft,
  updateMailUserState,
  getMailDirectory,
  getMailDiagnostics
} from "backend/RIA/mail.web";

const EMBED = "#mailEmbed";
const EMBED_SOURCE = "SKANDI_MAIL_EMBED";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const CHROME_SOURCE = "SKANDI_INTERNAL_CHROME";
const LOGIN_PATH = "/riaintra";
const HOME_PATH = "/";
const PROFILE_PATH = "/riaintra/success-factors";

let bootstrapPromise = null;

function currentPath() {
  return "/" + wixLocation.path.join("/");
}

function send(html, type, payload = {}) {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function allowedPath(path) {
  const p = String(path || "").trim();
  return p === "/" || p === LOGIN_PATH || p.startsWith("/riaintra/");
}

async function logout() {
  try { await authentication.logout(); } catch (_) {}
  wixLocation.to(HOME_PATH);
}

async function ensureSession() {
  const session = await getStaffPortalSession().catch(() => null);
  if (!session || session.ok === false || session.loggedIn === false || session.authorized === false) {
    wixLocation.to(LOGIN_PATH);
    return null;
  }
  return session;
}

async function bootstrap(html, { force = false } = {}) {
  if (bootstrapPromise && !force) return bootstrapPromise;

  bootstrapPromise = (async () => {
    const session = await ensureSession();
    if (!session) return null;

    const data = await getMailBootstrap();
    send(html, "MAIL_BOOTSTRAP", data);
    send(html, "INTERNAL_CHROME_BOOTSTRAP", {
      pageName: "Mail",
      pagePath: currentPath(),
      pageSubtitle: "Internal company mail",
      profile: data.profile,
      apps: data.apps || session.apps || [],
      isAltea: false
    });
    return data;
  })();

  try {
    return await bootstrapPromise;
  } finally {
    bootstrapPromise = null;
  }
}

$w.onReady(function () {
  const html = $w(EMBED);

  html.onMessage(async (event) => {
    const msg = event.data || {};
    const source = String(msg.source || "");
    const type = String(msg.type || msg.event || "");
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
        if (type === "INTERNAL_PROFILE_OPEN") {
          wixLocation.to(PROFILE_PATH);
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
        return;
      }

      if (source !== EMBED_SOURCE) return;

      switch (type) {
        case "MAIL_READY":
          await bootstrap(html);
          return;

        case "MAIL_LIST_REQUEST":
          send(html, "MAIL_LIST_RESPONSE", await listMailMessages(payload));
          return;

        case "MAIL_GET_REQUEST":
          send(html, "MAIL_GET_RESPONSE", await getMailMessage(payload));
          return;

        case "MAIL_SEND_REQUEST": {
          const result = await sendMailMessage(payload);
          send(html, "MAIL_SEND_RESPONSE", result);
          send(html, "MAIL_LIST_RESPONSE", await listMailMessages({ folder: "Sent", filter: "all", search: "" }));
          return;
        }

        case "MAIL_DRAFT_SAVE_REQUEST":
          send(html, "MAIL_DRAFT_SAVE_RESPONSE", await saveMailDraft(payload));
          return;

        case "MAIL_STATE_REQUEST": {
          const result = await updateMailUserState(payload);
          send(html, "MAIL_STATE_RESPONSE", result);
          send(html, "MAIL_LIST_RESPONSE", await listMailMessages({
            folder: payload.folder || "Inbox",
            filter: payload.filter || "all",
            search: payload.search || ""
          }));
          return;
        }

        case "MAIL_DIRECTORY_REQUEST":
          send(html, "MAIL_DIRECTORY_RESPONSE", await getMailDirectory());
          return;

        case "MAIL_DIAGNOSTICS_REQUEST":
          send(html, "MAIL_DIAGNOSTICS_RESPONSE", await getMailDiagnostics());
          return;

        case "MAIL_NAVIGATE":
          if (allowedPath(payload.path)) wixLocation.to(payload.path);
          return;

        default:
          send(html, "MAIL_ERROR", { action: type, message: "Unsupported Mail action." });
      }
    } catch (error) {
      console.error("RIA Mail page error", {
        type,
        message: error?.message || "Mail action failed"
      });
      send(html, "MAIL_ERROR", {
        action: type,
        message: error?.message || "Mail action failed."
      });
    }
  });
});
