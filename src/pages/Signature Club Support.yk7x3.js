import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";
import {
  getCustomerSupportBootstrap,
  createCustomerSupportCase,
  listCustomerSupportCases,
  getCustomerSupportCase,
  addCustomerSupportMessage
} from "backend/supportCenter.web";

const EMBED_ID = "#skandiMySupportEmbed";
const CHILD_SOURCE = "SKANDI_SUPPORT_CUSTOMER_PORTAL";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function objectOf(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function payloadOf(message) {
  return { ...objectOf(message), ...objectOf(message?.payload) };
}

function post(html, type, payload = {}, requestId = "") {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    requestId,
    payload: { ...objectOf(payload), requestId }
  });
}

function currentContext() {
  return {
    bookingRef: String(wixLocation.query.booking || wixLocation.query.pnr || "").trim(),
    topic: String(wixLocation.query.topic || "").trim()
  };
}

function caseIdOf(payload) {
  return String(payload.caseId || payload.case_id || payload.id || "").trim();
}

function messageOf(error) {
  return String(error?.publicMessage || error?.message || "Support Center action failed.").slice(0, 300);
}

async function bootstrap(html, requestId = "") {
  const result = await getCustomerSupportBootstrap(currentContext());
  post(html, "CUSTOMER_PORTAL_STATE", {
    profile: result?.profile || null,
    clubProfile: result?.clubProfile || null,
    supportContext: result?.supportContext || currentContext(),
    livekit: result?.livekit || { configured: false }
  }, requestId);
  post(html, "CUSTOMER_CASE_LIST", { cases: Array.isArray(result?.cases) ? result.cases : [] }, requestId);
}

$w.onReady(function () {
  let html;
  try {
    html = $w(EMBED_ID);
  } catch (error) {
    console.error(`[My Support] Missing HTML component ${EMBED_ID}.`, error);
    return;
  }

  html.onMessage(async event => {
    const message = objectOf(event.data);
    if (message.source !== CHILD_SOURCE) return;

    const payload = payloadOf(message);
    const requestId = String(message.requestId || payload.requestId || "");

    try {
      switch (message.type) {
        case "CUSTOMER_READY":
          await bootstrap(html, requestId);
          return;

        case "CUSTOMER_LIST_CASES": {
          const result = await listCustomerSupportCases({});
          post(html, "CUSTOMER_CASE_LIST", result, requestId);
          return;
        }

        case "CUSTOMER_OPEN_CASE": {
          const result = await getCustomerSupportCase({ caseId: caseIdOf(payload) });
          post(html, "CUSTOMER_CASE_DETAIL", result, requestId);
          return;
        }

        case "CUSTOMER_REPLY_CASE": {
          const result = await addCustomerSupportMessage({
            caseId: caseIdOf(payload),
            content: String(payload.content || payload.message || "")
          });
          post(html, "CUSTOMER_REPLY_SENT", result, requestId);
          return;
        }

        case "CUSTOMER_CREATE_CASE": {
          const input = objectOf(payload.case);
          const result = await createCustomerSupportCase(Object.keys(input).length ? input : payload);
          post(html, "CUSTOMER_CASE_CREATED", result, requestId);
          return;
        }

        case "CUSTOMER_INITIATE_DOCUSIGN":
          post(html, "CUSTOMER_ERROR", { message: "Secure signature requests are handled through the canonical SKANDI document workflow, not the Support Center chat." }, requestId);
          return;

        case "CUSTOMER_NAVIGATE":
          if (payload.path) wixLocation.to(String(payload.path));
          return;

        case "CUSTOMER_LOGOUT":
          await authentication.logout();
          wixLocation.to("/");
          return;

        default:
          return;
      }
    } catch (error) {
      console.error(`[My Support] ${message.type || "Unknown action"} failed.`, error);
      const code = String(error?.code || error?.name || "");
      const text = messageOf(error);
      if (code === "NOT_LOGGED_IN" || text.includes("Sign in")) {
        try {
          await authentication.promptLogin({ mode: "login" });
          await bootstrap(html, requestId);
          return;
        } catch (_loginError) {}
      }
      post(html, "CUSTOMER_ERROR", { message: text }, requestId);
    }
  });

  // Listener-first, then proactive bootstrap to cover iframe READY races.
  bootstrap(html).catch(error => {
    post(html, "CUSTOMER_ERROR", { message: messageOf(error) });
  });
});
