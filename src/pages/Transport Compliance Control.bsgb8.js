import {
  getStaffPortalSession
} from "backend/RIA/staffPortalAuth.web";

import {
  getTransportComplianceBootstrap
} from "backend/FINAL/documentControl.web";

const HTML_ID = "#transportComplianceHtml";
const CHILD_SOURCE = "SKANDI_TRANSPORT_COMPLIANCE_CONTROL";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";

function send(html, type, payload = {}) {
  html.postMessage({ source: PARENT_SOURCE, type, payload, timestamp: new Date().toISOString() });
}

$w.onReady(function () {
  const html = $w(HTML_ID);

  async function load() {
    const staff = await getStaffPortalSession();
    if (!staff?.authenticated) throw new Error("Staff authentication required.");

    const result = await getTransportComplianceBootstrap();
    send(html, "TRANSPORT_COMPLIANCE_LOAD", result);
  }

  html.onMessage(async (event) => {
    const message = event.data;
    if (!message || message.source !== CHILD_SOURCE) return;

    if (message.type === "TRANSPORT_COMPLIANCE_READY" ||
        message.type === "TRANSPORT_COMPLIANCE_REFRESH") {
      await load();
      return;
    }

    if (message.type === "TRANSPORT_COMPLIANCE_OPEN") {
      send(html, "TRANSPORT_COMPLIANCE_OPEN_RECORD", message.payload || {});
      return;
    }

    if (message.type === "TRANSPORT_COMPLIANCE_VERIFY") {
      send(html, "TRANSPORT_COMPLIANCE_OPEN_VERIFICATION", message.payload || {});
    }
  });
});
