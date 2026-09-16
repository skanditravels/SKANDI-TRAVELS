// /src/pages/How can we help_.k0iqp.js
// Route: /about/support
// HTML Components: #skandiHelpCenterEmbed + #skandiSupportChatEmbed
// R-007.3 listener-first bridge. Customer Support remains one canonical backend dependency.


import wixLocationFrontend from "wix-location-frontend";
import { openCustomerLogin } from "public/customerAuthUi.js";
import {
  getCustomerSupportBootstrap,
  createCustomerSupportCase,
  startAlexandraSupportSession,
  requestCustomerHumanHandoff,
  addCustomerLiveSupportMessage
} from "backend/SKANDI_CORE/customerSupport.web";


const HELP_EMBED_ID = "#skandiHelpCenterEmbed";
const CHAT_EMBED_ID = "#skandiSupportChatEmbed";
const HELP_SOURCE = "SKANDI_SUPPORT_PUBLIC";
const CHAT_SOURCE = "SKANDI_SUPPORT_CHAT";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";


// Replace with the PUBLIC Asset Library URL for asset key `alexandra-support-avatar` after upload.
// The chat HTML handles an empty value with the "A" fallback avatar.
const ALEXANDRA_AVATAR_MP4_URL = "";


function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function payloadOf(message = {}) { return { ...obj(message), ...obj(message.payload) }; }
function clean(value, max = 5000) { return String(value ?? "").trim().slice(0, max); }
function safePath(value) { const path = clean(value, 1000); return path.startsWith("/") && !path.startsWith("//") ? path : ""; }
function err(error) { return clean(error?.message || error || "Support action failed.", 500); }
function post(html, type, payload = {}, requestId = "") {
  if (!html) return;
  html.postMessage({ source: PARENT_SOURCE, type, requestId, payload: { ...obj(payload), requestId } });
}


$w.onReady(function () {
  let help = null;
  let chat = null;
  try { help = $w(HELP_EMBED_ID); } catch (_) {}
  try { chat = $w(CHAT_EMBED_ID); } catch (_) {}
  if (!help || !chat) {
    console.error(`[Help] R-007.3 requires ${HELP_EMBED_ID} and ${CHAT_EMBED_ID}.`);
    return;
  }


  let bootstrap = null;


  async function ensureBootstrap() {
    if (!bootstrap) bootstrap = await getCustomerSupportBootstrap();
    return bootstrap;
  }


  async function pushHelpBootstrap(requestId = "") {
    const data = await ensureBootstrap();
    const query = obj(wixLocationFrontend.query);
    post(help, "PUBLIC_SUPPORT_BOOTSTRAP", {
      ...obj(data),
      prefill: {
        category: clean(query.category, 80),
        subCategory: clean(query.topic || query.subCategory, 160),
        caseId: clean(query.caseId, 160)
      }
    }, requestId);
    return data;
  }


  async function pushChatBootstrap(requestId = "") {
    const data = await ensureBootstrap();
    post(chat, "SUPPORT_CHAT_BOOTSTRAP", {
      ...obj(data),
      alexandra: {
        avatarAssetKey: "alexandra-support-avatar",
        avatarVideoUrl: ALEXANDRA_AVATAR_MP4_URL,
        playbackRate: 0.75,
        displayName: "Alexandra",
        role: "Digital Customer Service Agent"
      }
    }, requestId);
  }


  async function openAlexandra(requestId = "") {
    await pushChatBootstrap(requestId);
    const result = await startAlexandraSupportSession({
      locale: clean(wixLocationFrontend.query?.lang || "en-US", 40),
      currency: clean(wixLocationFrontend.query?.currency || "USD", 12),
      pagePath: "/about/support"
    });
    post(chat, "SUPPORT_CHAT_OPEN", { mode: "ALEXANDRA", alexandraSession: result?.session, loggedIn: result?.loggedIn === true }, requestId);
  }


  async function requestHuman(payload = {}, requestId = "") {
    const result = await requestCustomerHumanHandoff({
      caseId: clean(payload.caseId, 160),
      input: obj(payload.input || payload),
      reason: clean(payload.reason || "Customer requested a Human SKANDI Customer Service Agent.", 2000),
      summary: clean(payload.summary, 6000),
      collectedFields: obj(payload.collectedFields),
      transcript: payload.transcript || ""
    });
    post(chat, "SUPPORT_CHAT_HUMAN_HANDOFF", result, requestId);
  }


  help.onMessage(async event => {
    const message = obj(event?.data);
    if (message.source !== HELP_SOURCE) return;
    const payload = payloadOf(message);
    const requestId = clean(message.requestId || payload.requestId, 160);
    try {
      switch (message.type) {
        case "PUBLIC_SUPPORT_READY":
        case "PUBLIC_SUPPORT_REQUEST_BOOTSTRAP":
          await pushHelpBootstrap(requestId);
          return;
        case "PUBLIC_SUPPORT_LOGIN":
          await openCustomerLogin({ sourcePage: "HELP_CENTER", reason: clean(payload.reason || "SKANDI_CLUB_LOGIN", 120), returnTo: "/about/support" });
          bootstrap = null;
          await pushHelpBootstrap(requestId);
          return;
        case "PUBLIC_SUPPORT_CREATE_CASE": {
          const result = await createCustomerSupportCase({ input: payload });
          post(help, "PUBLIC_SUPPORT_CASE_CREATED", result, requestId);
          post(chat, "SUPPORT_CHAT_CASE_CREATED", result, requestId);
          return;
        }
        case "PUBLIC_SUPPORT_OPEN_ALEXANDRA":
          await openAlexandra(requestId);
          return;
        case "PUBLIC_SUPPORT_REQUEST_HUMAN":
          await pushChatBootstrap(requestId);
          post(chat, "SUPPORT_CHAT_OPEN", { mode: "HANDOFF_PENDING" }, requestId);
          await requestHuman(payload, requestId);
          return;
        case "PUBLIC_SUPPORT_OPEN_FORM":
          await pushChatBootstrap(requestId);
          post(chat, "SUPPORT_CHAT_OPEN", { mode: "FORM", formPrefill: payload }, requestId);
          return;
        case "PUBLIC_SUPPORT_NAVIGATE": {
          const path = safePath(payload.path || message.path);
          if (path) wixLocationFrontend.to(path);
          return;
        }
        default:
          return;
      }
    } catch (error) {
      console.error(`[Help] ${message.type || "Support action"} failed.`, error);
      post(help, "PUBLIC_SUPPORT_ERROR", { action: clean(message.type, 120), message: err(error) }, requestId);
      post(chat, "SUPPORT_CHAT_ERROR", { action: clean(message.type, 120), message: err(error) }, requestId);
    }
  });


  chat.onMessage(async event => {
    const message = obj(event?.data);
    if (message.source !== CHAT_SOURCE) return;
    const payload = payloadOf(message);
    const requestId = clean(message.requestId || payload.requestId, 160);
    try {
      switch (message.type) {
        case "SUPPORT_CHAT_READY":
          await pushChatBootstrap(requestId);
          return;
        case "SUPPORT_CHAT_START_ALEXANDRA":
          await openAlexandra(requestId);
          return;
        case "SUPPORT_CHAT_START_HUMAN":
          await requestHuman(payload, requestId);
          return;
        case "SUPPORT_CHAT_HUMAN_MESSAGE": {
          const result = await addCustomerLiveSupportMessage({
            caseId: clean(payload.caseId, 160),
            content: clean(payload.content, 30000)
          });
          post(chat, "SUPPORT_CHAT_HUMAN_MESSAGE_SAVED", result, requestId);
          return;
        }
        case "SUPPORT_CHAT_SUBMIT_FORM": {
          const result = await createCustomerSupportCase({ input: obj(payload.input || payload) });
          post(chat, "SUPPORT_CHAT_CASE_CREATED", result, requestId);
          post(help, "PUBLIC_SUPPORT_CASE_CREATED", result, requestId);
          return;
        }
        case "SUPPORT_CHAT_NAVIGATE": {
          const path = safePath(payload.path || message.path);
          if (path) wixLocationFrontend.to(path);
          return;
        }
        default:
          return;
      }
    } catch (error) {
      console.error(`[Help chat] ${message.type || "Support action"} failed.`, error);
      post(chat, "SUPPORT_CHAT_ERROR", { action: clean(message.type, 120), message: err(error) }, requestId);
    }
  });
});
