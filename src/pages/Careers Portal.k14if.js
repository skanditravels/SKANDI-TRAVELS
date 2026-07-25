import {
  requestApplicantPortalCode,
  verifyApplicantPortalCode,
  getApplicantPortalData
} from "backend/careersService.web";

import wixLocation from "wix-location-frontend";

const EMBED_ID = "#careerPortalEmbed";
const HTML_SOURCE = "SKANDI_APPLICANT_PORTAL";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function send(type, payload = {}) {
  $w(EMBED_ID).postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() });
}

$w.onReady(function () {
  const html = $w(EMBED_ID);

  html.onMessage(async (event) => {
    const msg = event.data || {};
    const source = msg.source || "";
    if (source && source !== HTML_SOURCE) return;

    try {
      if (msg.type === "APPLICANT_PORTAL_REQUEST_CODE") {
        send("APPLICANT_PORTAL_CODE_RESULT", await requestApplicantPortalCode(msg.payload || {}));
        return;
      }

      if (msg.type === "APPLICANT_PORTAL_LOGIN") {
        const login = await verifyApplicantPortalCode(msg.payload || {});
        if (!login.ok) {
          send("APPLICANT_PORTAL_LOGIN_RESULT", login);
          return;
        }
        const data = await getApplicantPortalData({ sessionToken: login.sessionToken });
        send("APPLICANT_PORTAL_LOGIN_RESULT", { ...data, sessionToken: login.sessionToken });
        return;
      }

      if (msg.type === "APPLICANT_OPEN_DOCUMENT") {
        const sessionToken = msg.payload?.sessionToken || "";
        const token = msg.payload?.token || "";
        const data = await getApplicantPortalData({ sessionToken });
        const email = msg.payload?.email || data.applicant?.email || "";
        const packet = (data.documentRequests || []).find((p) => p.token === token);
        if (!packet || !email || !token) {
          send("APPLICANT_PORTAL_ERROR", { message: "Document request is not available for this applicant session." });
          return;
        }
        wixLocation.to(`/careers/documents?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`);
        return;
      }
    } catch (error) {
      send("APPLICANT_PORTAL_ERROR", { message: error.message || "Applicant portal unavailable." });
    }
  });
});