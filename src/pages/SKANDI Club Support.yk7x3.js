// /src/pages/SKANDI Club Support.yk7x3.js
// Route: /my-profile/support
// HTML Components: #skandiMySupportEmbed + #skandiSupportChatEmbed
// R-007.3 preserves the current customer Support Center contract and adds the shared Human Support chat shell.


import wixLocationFrontend from "wix-location-frontend";
import { authentication } from "wix-members-frontend";
import {
  getCustomerSupportBootstrap,
  createCustomerSupportCase,
  listCustomerSupportCases,
  getCustomerSupportCase,
  addCustomerSupportMessage,
  requestCustomerHumanHandoff,
  addCustomerLiveSupportMessage
} from "backend/SKANDI_CORE/customerSupport.web";


const SUPPORT_EMBED_ID = "#skandiMySupportEmbed";
const CHAT_EMBED_ID = "#skandiSupportChatEmbed";
const SUPPORT_SOURCE = "SKANDI_SUPPORT_CUSTOMER_PORTAL";
const CHAT_SOURCE = "SKANDI_SUPPORT_CHAT";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";


function objectOf(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function payloadOf(message) { return { ...objectOf(message), ...objectOf(message?.payload) }; }
function clean(value, max = 30000) { return String(value ?? "").trim().slice(0, max); }
function currentContext() {
  return {
    bookingRef: clean(wixLocationFrontend.query?.booking || wixLocationFrontend.query?.pnr, 80),
    topic: clean(wixLocationFrontend.query?.topic, 160)
  };
}
function caseIdOf(payload) { return clean(payload.caseId || payload.case_id || payload.id, 160); }
function messageOf(error) { return clean(error?.publicMessage || error?.message || "Support Center action failed.", 300); }
function post(html, type, payload = {}, requestId = "") {
  if (!html?.postMessage) return;
  html.postMessage({ source: PARENT_SOURCE, type, requestId, payload: { ...objectOf(payload), requestId } });
}


$w.onReady(function () {
  let support = null;
  let chat = null;
  try { support = $w(SUPPORT_EMBED_ID); } catch (_) {}
  try { chat = $w(CHAT_EMBED_ID); } catch (_) {}
  if (!support || !chat) {
    console.error(`[My Support] R-007.3 requires ${SUPPORT_EMBED_ID} and ${CHAT_EMBED_ID}.`);
    return;
  }


  let bootstrapState = null;


  async function getBootstrapState() {
    if (!bootstrapState) bootstrapState = await getCustomerSupportBootstrap(currentContext());
    return bootstrapState;
  }


  async function pushChatBootstrap(requestId = "") {
    const result = await getBootstrapState();
    post(chat, "SUPPORT_CHAT_BOOTSTRAP", {
      ...objectOf(result),
      defaultMode: "HUMAN",
      supportContext: { ...currentContext(), page: "/my-profile/support" }
    }, requestId);
  }


  async function bootstrap(requestId = "") {
    const [result, cases] = await Promise.all([
      getBootstrapState(),
      listCustomerSupportCases({})
    ]);
    post(support, "CUSTOMER_PORTAL_STATE", {
      profile: result?.profile || null,
      clubProfile: result?.clubProfile || null,
      supportContext: result?.supportContext || currentContext(),
      humanSupport: result?.humanSupport || null,
      livekit: result?.livekit || { configured: false }
    }, requestId);
    post(support, "CUSTOMER_CASE_LIST", { cases: Array.isArray(cases?.cases) ? cases.cases : [] }, requestId);
    await pushChatBootstrap(requestId);
  }


  async function requestHuman(payload = {}, requestId = "") {
    await pushChatBootstrap(requestId);
    post(chat, "SUPPORT_CHAT_OPEN", { mode: "HANDOFF_PENDING" }, requestId);
    const result = await requestCustomerHumanHandoff({
      caseId: caseIdOf(payload),
      input: objectOf(payload.input),
      reason: clean(payload.reason || "Customer requested a Human SKANDI Customer Service Agent from My Support.", 2000),
      summary: clean(payload.summary, 6000),
      collectedFields: objectOf(payload.collectedFields),
      transcript: payload.transcript || ""
    });
    post(support, "CUSTOMER_HUMAN_HANDOFF", result, requestId);
    post(chat, "SUPPORT_CHAT_HUMAN_HANDOFF", result, requestId);
    return result;
  }


  support.onMessage(async event => {
    const message = objectOf(event.data);
    if (message.source !== SUPPORT_SOURCE) return;
    const payload = payloadOf(message);
    const requestId = clean(message.requestId || payload.requestId, 160);


    try {
      switch (message.type) {
        case "CUSTOMER_READY":
          await bootstrap(requestId);
          return;


        case "CUSTOMER_LIST_CASES":
          post(support, "CUSTOMER_CASE_LIST", await listCustomerSupportCases({}), requestId);
          return;


        case "CUSTOMER_OPEN_CASE":
          post(support, "CUSTOMER_CASE_DETAIL", await getCustomerSupportCase({ caseId: caseIdOf(payload) }), requestId);
          return;


        case "CUSTOMER_REPLY_CASE":
          post(support, "CUSTOMER_REPLY_SENT", await addCustomerSupportMessage({
            caseId: caseIdOf(payload),
            content: clean(payload.content || payload.message, 30000)
          }), requestId);
          return;


        case "CUSTOMER_CREATE_CASE": {
          const input = objectOf(payload.case);
          const result = await createCustomerSupportCase({ input: Object.keys(input).length ? input : payload });
          post(support, "CUSTOMER_CASE_CREATED", result, requestId);
          bootstrapState = null;
          await bootstrap(requestId);
          return;
        }


        case "CUSTOMER_REQUEST_HUMAN":
          await requestHuman(payload, requestId);
          return;


        case "CUSTOMER_LIVE_MESSAGE": {
          const result = await addCustomerLiveSupportMessage({
            caseId: caseIdOf(payload),
            content: clean(payload.content || payload.message, 30000)
          });
          post(support, "CUSTOMER_LIVE_MESSAGE_SAVED", result, requestId);
          post(chat, "SUPPORT_CHAT_HUMAN_MESSAGE_SAVED", result, requestId);
          return;
        }


        case "CUSTOMER_INITIATE_DOCUSIGN":
          post(support, "CUSTOMER_ERROR", { message: "Secure signature requests are handled through the canonical SKANDI document workflow, not the Support Center chat." }, requestId);
          return;


        case "CUSTOMER_NAVIGATE":
          if (String(payload.path || "").startsWith("/")) wixLocationFrontend.to(String(payload.path));
          return;


        case "CUSTOMER_LOGOUT":
          await authentication.logout();
          wixLocationFrontend.to("/");
          return;


        default:
          return;
      }
    } catch (error) {
      console.error(`[My Support] ${message.type || "Unknown action"} failed.`, error);
      const text = messageOf(error);
      if (text.includes("SIGN_IN") || text.includes("Sign in")) {
        try {
          await authentication.promptLogin({ mode: "login" });
          bootstrapState = null;
          await bootstrap(requestId);
          return;
        } catch (_) {}
      }
      post(support, "CUSTOMER_ERROR", { message: text }, requestId);
      post(chat, "SUPPORT_CHAT_ERROR", { message: text }, requestId);
    }
  });


  chat.onMessage(async event => {
    const message = objectOf(event.data);
    if (message.source !== CHAT_SOURCE) return;
    const payload = payloadOf(message);
    const requestId = clean(message.requestId || payload.requestId, 160);
    try {
      switch (message.type) {
        case "SUPPORT_CHAT_READY":
          await pushChatBootstrap(requestId);
          return;


        case "SUPPORT_CHAT_START_HUMAN":
          await requestHuman(payload, requestId);
          return;


        case "SUPPORT_CHAT_HUMAN_MESSAGE": {
          const result = await addCustomerLiveSupportMessage({
            caseId: caseIdOf(payload),
            content: clean(payload.content, 30000)
          });
          post(chat, "SUPPORT_CHAT_HUMAN_MESSAGE_SAVED", result, requestId);
          return;
        }


        case "SUPPORT_CHAT_SUBMIT_FORM": {
          const result = await createCustomerSupportCase({ input: objectOf(payload.input || payload) });
          post(chat, "SUPPORT_CHAT_CASE_CREATED", result, requestId);
          post(support, "CUSTOMER_CASE_CREATED", result, requestId);
          bootstrapState = null;
          await bootstrap(requestId);
          return;
        }


        case "SUPPORT_CHAT_NAVIGATE":
          if (String(payload.path || "").startsWith("/")) wixLocationFrontend.to(String(payload.path));
          return;


        case "SUPPORT_CHAT_START_ALEXANDRA":
          post(chat, "SUPPORT_CHAT_ERROR", { message: "Alexandra is available from the main Help Center. This signed-in Support Center opens Human Customer Service chat." }, requestId);
          return;


        default:
          return;
      }
    } catch (error) {
      console.error(`[My Support chat] ${message.type || "Unknown action"} failed.`, error);
      post(chat, "SUPPORT_CHAT_ERROR", { message: messageOf(error) }, requestId);
    }
  });


  bootstrap().catch(error => {
    post(support, "CUSTOMER_ERROR", { message: messageOf(error) });
    post(chat, "SUPPORT_CHAT_ERROR", { message: messageOf(error) });
  });
});
