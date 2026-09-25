// /src/pages/Work at SKANDI.dyodg.js
// SKANDI Careers Hub — B-011.1 merged public careers/applicant/documents bridge.
// Canonical route: /about/careers
// Canonical HTML Component: #careersEmbed

import wixLocationFrontend from "wix-location-frontend";
import {
  getPublicCareerData,
  prepareCareerApplicationUploads,
  submitCareerApplication,
  requestApplicantPortalCode,
  verifyApplicantPortalCode,
  getApplicantPortalData,
  logoutApplicantPortalSession,
  getCareerDocumentPacket,
  submitCareerDocumentExecution,
  getCareerPublicForms
} from "backend/SKANDI_CORE/careers.web";
import { APP_ROUTES, SITE_MAP, isSafeInternalRoute } from "public/siteMap";

const VERSION = "B-011.1";
const EMBED_ID = "#careersEmbed";
const HTML_SOURCE = "SKANDI_CAREERS_HUB";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

let html = null;
let mutationBusy = false;

function send(type, payload = {}) {
  if (!html) return;
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function errorPayload(error) {
  return {
    code: String(error?.code || "CAREERS_ERROR"),
    message: error?.publicMessage || error?.message || "Careers is temporarily unavailable."
  };
}

function initialRouteState() {
  const query = wixLocationFrontend.query || {};
  const requested = String(query.view || "").toLowerCase();
  const view = ["portal", "documents"].includes(requested) ? requested : "jobs";
  return {
    view,
    email: String(query.email || "").trim().slice(0, 254),
    token: String(query.token || "").trim().slice(0, 500)
  };
}

async function sendPublicData() {
  send("CAREERS_DATA", await getPublicCareerData());
}

async function sendPublicForms() {
  send("CAREERS_PUBLIC_FORMS_DATA", await getCareerPublicForms());
}

async function refreshPortal(sessionToken) {
  if (!sessionToken) return;
  send("APPLICANT_PORTAL_DATA", {
    ...(await getApplicantPortalData({ sessionToken })),
    sessionToken
  });
}

function setEmbedHeight(value) {
  const requested = Number(value || 0);
  if (!html || !Number.isFinite(requested) || requested <= 0) return;
  html.height = Math.max(900, Math.min(30000, Math.round(requested)));
}

$w.onReady(async () => {
  try {
    html = $w(EMBED_ID);
  } catch (error) {
    console.error(`[SKANDI Careers ${VERSION}] Missing ${EMBED_ID}.`, error);
    return;
  }

  if (!html || typeof html.onMessage !== "function" || typeof html.postMessage !== "function") {
    console.error(`[SKANDI Careers ${VERSION}] ${EMBED_ID} is not a compatible HTML Component.`);
    return;
  }

  html.onMessage(async event => {
    const message = event?.data || {};
    if (message.source && message.source !== HTML_SOURCE) return;

    const payload = message.payload || {};
    const mutationTypes = new Set([
      "CAREERS_UPLOAD_PREPARE",
      "CAREERS_APPLY",
      "APPLICANT_PORTAL_REQUEST_CODE",
      "APPLICANT_PORTAL_LOGIN",
      "APPLICANT_PORTAL_LOGOUT",
      "DOCUMENT_EXEC_SUBMIT"
    ]);

    if (mutationTypes.has(message.type) && mutationBusy) return;
    if (mutationTypes.has(message.type)) mutationBusy = true;

    try {
      switch (message.type) {
        case "CAREERS_READY":
        case "CAREERS_REFRESH":
          await Promise.all([sendPublicData(), sendPublicForms()]);
          send("CAREERS_HOST_READY", {
            version: VERSION,
            route: APP_ROUTES.careers,
            supportPath: SITE_MAP.support,
            ...initialRouteState()
          });
          return;

        case "CAREERS_UPLOAD_PREPARE": {
          const result = await prepareCareerApplicationUploads(payload);
          send("CAREERS_UPLOAD_READY", { ...result, requestId: payload.requestId || "" });
          return;
        }

        case "CAREERS_APPLY":
          send("CAREERS_APPLICATION_RESULT", await submitCareerApplication(payload.application || payload));
          await sendPublicData();
          return;

        case "APPLICANT_PORTAL_REQUEST_CODE":
          send("APPLICANT_PORTAL_CODE_RESULT", await requestApplicantPortalCode(payload));
          return;

        case "APPLICANT_PORTAL_LOGIN": {
          const login = await verifyApplicantPortalCode(payload);
          if (!login.ok) {
            send("APPLICANT_PORTAL_LOGIN_RESULT", login);
            return;
          }
          const data = await getApplicantPortalData({ sessionToken: login.sessionToken });
          send("APPLICANT_PORTAL_LOGIN_RESULT", {
            ...data,
            sessionToken: login.sessionToken,
            expiresAt: login.expiresAt
          });
          return;
        }

        case "APPLICANT_PORTAL_REFRESH":
          await refreshPortal(payload.sessionToken);
          return;

        case "APPLICANT_PORTAL_LOGOUT":
          if (payload.sessionToken) {
            await logoutApplicantPortalSession({ sessionToken: payload.sessionToken });
          }
          send("APPLICANT_PORTAL_LOGOUT_RESULT", { ok: true });
          return;

        case "APPLICANT_OPEN_DOCUMENT":
        case "DOCUMENT_PACKET_LOAD_REQUEST":
          send("DOCUMENT_PACKET_DATA", await getCareerDocumentPacket(payload));
          return;

        case "DOCUMENT_EXEC_SUBMIT": {
          const result = await submitCareerDocumentExecution(payload);
          send("DOCUMENT_EXECUTION_RESULT", result);
          if (payload.sessionToken) await refreshPortal(payload.sessionToken);
          return;
        }

        case "DOCUMENT_SUPPORT_REQUEST":
          send("CAREERS_NAVIGATE_RESULT", { path: SITE_MAP.support });
          wixLocationFrontend.to(SITE_MAP.support);
          return;

        case "CAREERS_NAVIGATE": {
          const path = String(payload.path || "").trim();
          if (!isSafeInternalRoute(path)) throw new Error("CAREERS_NAVIGATION_INVALID");
          wixLocationFrontend.to(path);
          return;
        }

        case "CAREERS_HEIGHT":
          setEmbedHeight(payload.height);
          return;

        default:
          return;
      }
    } catch (error) {
      send("CAREERS_ERROR", errorPayload(error));
    } finally {
      if (mutationTypes.has(message.type)) mutationBusy = false;
    }
  });

  send("CAREERS_HOST_READY", {
    version: VERSION,
    route: APP_ROUTES.careers,
    supportPath: SITE_MAP.support,
    ...initialRouteState()
  });

  await Promise.all([
    sendPublicData().catch(error => send("CAREERS_ERROR", errorPayload(error))),
    sendPublicForms().catch(error => send("CAREERS_ERROR", errorPayload(error)))
  ]);
});
