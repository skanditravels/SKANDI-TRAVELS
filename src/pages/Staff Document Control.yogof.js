import {
  getStaffPortalSession
} from "backend/RIA/staffPortalAuth.web";

import {
  getDocumentControlBootstrap,
  listDocumentControlData,
  issueControlledDocument
} from "backend/FINAL/documentControl.web";

const HTML_ID = "#documentControlHtml";
const CHILD_SOURCE = "SKANDI_DOCUMENT_CONTROL";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function send(html, type, payload = {}) {
  html.postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() });
}

$w.onReady(function () {
  const html = $w(HTML_ID);

  async function session() {
    const value = await getStaffPortalSession();
    if (!value?.authenticated) throw new Error("Staff authentication required.");
    return value;
  }

  async function bootstrap() {
    const [staff, data] = await Promise.all([session(), getDocumentControlBootstrap()]);
    send(html, "DOCUMENT_CONTROL_BOOTSTRAP", {
      ...data,
      agent: staff.staff?.skId || staff.skId || "STAFF",
      station: staff.staff?.station || staff.station || "GLOBAL"
    });
  }

  html.onMessage(async (event) => {
    const message = event.data;
    if (!message || message.source !== CHILD_SOURCE) return;

    if (message.type === "DOCUMENT_CONTROL_READY") {
      await bootstrap();
      return;
    }

    if (message.type === "DOCUMENT_CONTROL_TAB" ||
        message.type === "DOCUMENT_CONTROL_REFRESH") {
      await session();
      const result = await listDocumentControlData({ tab: message.payload?.tab || "instances" });
      send(html, "DOCUMENT_CONTROL_DATA", result);
      return;
    }

    if (message.type === "DOCUMENT_CONTROL_ISSUE") {
      const staff = await session();
      await issueControlledDocument({
        documentId: message.payload?.documentId,
        issuedBy: staff.staff?.skId || staff.skId || ""
      });
      await bootstrap();
      return;
    }

    if (message.type === "DOCUMENT_CONTROL_VIEW") {
      send(html, "DOCUMENT_CONTROL_OPEN_VIEWER", {
        documentId: message.payload?.documentId || ""
      });
    }
  });
});
