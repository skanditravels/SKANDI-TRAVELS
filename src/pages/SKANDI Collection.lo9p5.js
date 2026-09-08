import wixLocationFrontend from "wix-location-frontend";
import { currentMember, authentication } from "wix-members-frontend";
import {
  getCustomerHeaderSession,
  subscribeCustomerNewsletter
} from "backend/customerHeader.web";
import { getSkandiAboutPagePayload } from "backend/skandiAboutSignature.web";

const EMBED_ID = "#aboutSkandiEmbed";
const ABOUT_SOURCE = "SKANDI_ABOUT_PAGE";
const FOOTER_SOURCE = "SKANDI_CUSTOMER_FOOTER";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

let headerLoadPromise = null;
let aboutLoadPromise = null;

function getHtmlComponent() {
  try {
    const html = $w(EMBED_ID);
    if (!html || typeof html.onMessage !== "function" || typeof html.postMessage !== "function") {
      console.error(`[About] ${EMBED_ID} is not configured as a Wix HTML component.`);
      return null;
    }
    return html;
  } catch (error) {
    console.error(`[About] HTML component ${EMBED_ID} was not found.`, error);
    return null;
  }
}

function parseMessage(data) {
  if (typeof data === "string") {
    try { return JSON.parse(data); }
    catch (_) { return null; }
  }
  return data && typeof data === "object" ? data : null;
}

function send(html, type, payload = {}) {
  if (!html) return;
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function safeLanguage(value) {
  const code = String(value || "EN").trim().toUpperCase();
  return ["EN", "SV", "NO", "DA", "FI"].includes(code) ? code : "EN";
}

async function sendAboutPageData(html, input = {}, force = false) {
  if (aboutLoadPromise && !force) return aboutLoadPromise;

  aboutLoadPromise = (async () => {
    try {
      send(html, "ABOUT_PAGE_LOADING", { live: true });
      const data = await getSkandiAboutPagePayload({
        language: safeLanguage(input.language || input.locale)
      });
      send(html, "ABOUT_PAGE_DATA", data || {});
      return data;
    } catch (error) {
      console.error("[About] Live Inventory Control content failed.", error);
      send(html, "ABOUT_PAGE_ERROR", {
        message: error?.message || "SKANDI Collection inventory could not be loaded."
      });
      throw error;
    } finally {
      aboutLoadPromise = null;
    }
  })();

  return aboutLoadPromise;
}

function closeHeaderPanels(html) {
  send(html, "CLOSE_CUSTOMER_HEADER_PANELS", {});
}

function navigateTo(html, rawPath) {
  const path = String(rawPath || "").trim();
  if (!path) return;
  if (!(path.startsWith("/") || /^https?:\/\//i.test(path) || /^mailto:/i.test(path) || /^tel:/i.test(path))) {
    console.warn(`[About] Blocked invalid navigation target: ${path}`);
    return;
  }
  closeHeaderPanels(html);
  try { wixLocationFrontend.to(path); }
  catch (error) { console.error(`[About] Navigation failed for ${path}.`, error); }
}

function guestHeaderState() {
  return { loggedIn: false, displayName: "", points: 0, tierName: "", menu: [] };
}

async function sendCustomerHeaderState(html, forceRefresh = false) {
  if (headerLoadPromise && !forceRefresh) return headerLoadPromise;

  headerLoadPromise = (async () => {
    try {
      const member = await currentMember.getMember();
      if (!member) {
        send(html, "CUSTOMER_HEADER_STATE", guestHeaderState());
        return;
      }

      const session = await getCustomerHeaderSession();
      send(html, "CUSTOMER_HEADER_STATE", {
        loggedIn: true,
        displayName:
          session?.displayName ||
          session?.name ||
          session?.member?.displayName ||
          member?.profile?.nickname ||
          member?.profile?.title ||
          member?.loginEmail ||
          "",
        points: Number(session?.points || session?.clubPoints || session?.rewards?.points || 0),
        tierName: session?.tierName || session?.tier || session?.clubTier || "",
        menu: Array.isArray(session?.menu) ? session.menu : []
      });
    } catch (error) {
      console.error("[About] Could not load customer header state.", error);
      send(html, "CUSTOMER_HEADER_STATE", guestHeaderState());
    } finally {
      headerLoadPromise = null;
    }
  })();

  return headerLoadPromise;
}

async function handleAboutMessage(html, message) {
  const payload = message.payload || {};
  const path = String(message.path || payload.path || "").trim();

  switch (message.type) {
    case "ABOUT_PAGE_READY":
      await Promise.allSettled([
        sendAboutPageData(html, payload),
        sendCustomerHeaderState(html)
      ]);
      return true;

    case "ABOUT_PAGE_REFRESH":
      await sendAboutPageData(html, payload, true).catch(() => {});
      return true;

    case "HEADER_READY":
      await sendCustomerHeaderState(html);
      return true;

    case "HOME_NAVIGATE":
    case "HEADER_NAVIGATE":
      navigateTo(html, path);
      return true;

    case "HEADER_SEARCH":
      navigateTo(html, "/search");
      return true;

    case "HEADER_LOGIN":
      closeHeaderPanels(html);
      try { await authentication.promptLogin(); }
      catch (error) { console.info("[About] Login cancelled or incomplete.", error); }
      await sendCustomerHeaderState(html, true);
      return true;

    case "HEADER_LOGOUT":
      closeHeaderPanels(html);
      try { await Promise.resolve(authentication.logout()); }
      catch (error) { console.warn("[About] Logout returned an error.", error); }
      send(html, "CUSTOMER_HEADER_STATE", guestHeaderState());
      wixLocationFrontend.to("/home");
      return true;

    case "UPDATE_SETTINGS":
      await sendAboutPageData(html, payload, true).catch(() => {});
      return true;

    default:
      return false;
  }
}

async function handleFooterMessage(html, message) {
  const payload = message.payload || {};
  const path = String(message.path || payload.path || "").trim();

  switch (message.type) {
    case "FOOTER_READY":
      send(html, "CUSTOMER_FOOTER_STATE", { ready: true });
      return true;

    case "FOOTER_NAVIGATE":
      navigateTo(html, path);
      return true;

    case "FOOTER_STAFF_LOGIN":
      navigateTo(html, "/riaintra");
      return true;

    case "FOOTER_NEWSLETTER_SIGNUP": {
      const email = String(message.email || payload.email || "").trim();
      if (!email) {
        send(html, "FOOTER_NEWSLETTER_RESULT", {
          ok: false,
          message: "Please enter your email address."
        });
        return true;
      }

      try {
        const result = await subscribeCustomerNewsletter({
          email,
          source: payload.source || "Footer"
        });
        send(html, "FOOTER_NEWSLETTER_RESULT", {
          ok: true,
          message: result?.status === "updated"
            ? "Your subscription is already active."
            : "Thank you for subscribing.",
          ...(result || {})
        });
      } catch (error) {
        console.error("[About] Newsletter signup failed.", error);
        send(html, "FOOTER_NEWSLETTER_RESULT", {
          ok: false,
          message: error?.message || "Newsletter signup failed."
        });
      }
      return true;
    }

    default:
      return false;
  }
}

$w.onReady(function () {
  const html = getHtmlComponent();
  if (!html) return;

  html.onMessage(async event => {
    const message = parseMessage(event.data);
    if (!message?.type) return;

    try {
      if (message.source === ABOUT_SOURCE) {
        await handleAboutMessage(html, message);
        return;
      }
      if (message.source === FOOTER_SOURCE) {
        await handleFooterMessage(html, message);
        return;
      }
      console.warn(`[About] Ignored message from unknown source: ${message.source || "none"}`);
    } catch (error) {
      console.error(`[About] ${message.source || "unknown"} / ${message.type || "unknown"} failed.`, error);
      if (message.source === ABOUT_SOURCE) {
        send(html, "ABOUT_PAGE_ERROR", {
          message: error?.message || "About page action failed."
        });
      }
    }
  });
});
