import wixLocationFrontend from "wix-location-frontend";
import {
  getPolicyControlBootstrap,
  listPolicyDocuments,
  getPolicyDocument,
  savePolicyDocument,
  publishPolicyDocument,
  archivePolicyDocument,
  deletePolicyDocument,
  regeneratePolicyPdf,
  parsePolicyPdfText
} from "backend/FINAL/policyControl.web";

const EMBED_ID = "#policyControlEmbed";
const CHILD_SOURCE = "SKANDI_POLICY_CONTROL";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const LOGIN_PATH = "/riaintra";

let html = null;
let bootstrapPromise = null;

function post(type, payload = {}) {
  if (!html) return;
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload: payload || {},
    timestamp: new Date().toISOString()
  });
}

function cleanError(error) {
  const message = String(
    error?.publicMessage ||
    error?.message ||
    error ||
    "Policy Control action failed."
  ).trim();
  return message.length > 300 ? "Policy Control action failed." : message;
}

function safeInternalPath(path) {
  const value = String(path || "").trim();
  return (
    value === "/" ||
    value === LOGIN_PATH ||
    value.startsWith("/riaintra") ||
    value.startsWith("/altea")
  );
}

async function bootstrap(force = false) {
  if (bootstrapPromise && !force) return bootstrapPromise;

  bootstrapPromise = (async () => {
    const result = await getPolicyControlBootstrap();

    post("POLICY_BOOTSTRAP", result);

    if (result?.ok === false && /sign-in|required|authentication/i.test(String(result?.error || ""))) {
      setTimeout(() => wixLocationFrontend.to(LOGIN_PATH), 900);
    }

    return result;
  })();

  try {
    return await bootstrapPromise;
  } finally {
    bootstrapPromise = null;
  }
}

async function refreshList(payload = {}) {
  const result = await listPolicyDocuments(payload);
  post("POLICY_LIST", result);
  return result;
}

async function handleMessage(event) {
  const message = event?.data || {};
  if (message.source !== CHILD_SOURCE) return;

  const type = String(message.type || "");
  const payload = message.payload && typeof message.payload === "object"
    ? message.payload
    : {};

  try {
    if (type === "POLICY_READY") {
      await bootstrap(true);
      return;
    }

    if (type === "POLICY_LIST_REQUEST") {
      await refreshList(payload);
      return;
    }

    if (type === "POLICY_GET_REQUEST") {
      post("POLICY_DETAIL", await getPolicyDocument(payload));
      return;
    }

    if (type === "POLICY_SAVE_REQUEST") {
      const result = await savePolicyDocument({
        policy: payload.policy || {},
        changeSummary: payload.changeSummary || "Saved from Policy Control."
      });
      post("POLICY_SAVED", result);
      await refreshList({});
      return;
    }

    if (type === "POLICY_PUBLISH_REQUEST") {
      const result = await publishPolicyDocument(payload);
      post("POLICY_SAVED", result);
      await refreshList({});
      return;
    }

    if (type === "POLICY_ARCHIVE_REQUEST") {
      const result = await archivePolicyDocument(payload);
      post("POLICY_SAVED", result);
      await refreshList({});
      return;
    }

    if (type === "POLICY_DELETE_REQUEST") {
      const result = await deletePolicyDocument(payload);
      post("POLICY_DELETED", result);
      return;
    }

    if (type === "POLICY_PDF_REGENERATE_REQUEST") {
      const result = await regeneratePolicyPdf(payload);
      post("POLICY_SAVED", result);
      return;
    }

    if (type === "POLICY_PDF_PARSE_REQUEST") {
      const result = await parsePolicyPdfText(payload);
      post("POLICY_PDF_PARSED", result);
      return;
    }

    if (type === "POLICY_NAVIGATE") {
      const path = String(payload.path || "").trim();
      if (safeInternalPath(path)) wixLocationFrontend.to(path);
      return;
    }
  } catch (error) {
    console.error(`[Policy Control] ${type}`, error);
    post("POLICY_ERROR", {
      action: type,
      message: cleanError(error)
    });
  }
}

$w.onReady(async function () {
  html = $w(EMBED_ID);
  html.onMessage(handleMessage);

  // Do not rely solely on POLICY_READY. Wix can finish page code after
  // the HTML component has already sent its initial ready event.
  await bootstrap(true).catch((error) => {
    console.error("[Policy Control] bootstrap", error);
    post("POLICY_BOOTSTRAP", {
      ok: false,
      authorized: false,
      error: cleanError(error)
    });
  });
});
