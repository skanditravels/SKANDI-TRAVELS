import wixLocation from "wix-location";
import {
  getUniformEmployeeBootstrap,
  submitUniformEmployeeOrder,
  acknowledgeUniformPolicy
} from "backend/uniformCenterSupabase.web";

const HTML_ID = "#uniformCenterEmbed";
const CHILD_SOURCE = "SKANDI_UNIFORM_EMPLOYEE";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const LOGIN_PATH = "/riaintra";

function send(html, type, payload = {}, extra = {}) {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    ...extra,
    timestamp: new Date().toISOString()
  });
}

$w.onReady(function () {
  const html = $w(HTML_ID);

  html.onMessage(async (event) => {
    const msg = event.data || {};
    if (msg.source !== CHILD_SOURCE) return;

    const payload = msg.payload || {};
    const requestId = msg.requestId || payload.requestId || "";

    try {
      if (msg.type === "UNIFORM_EMPLOYEE_READY" || msg.type === "UNIFORM_EMPLOYEE_BOOTSTRAP") {
        const result = await getUniformEmployeeBootstrap();
        send(html, "UNIFORM_EMPLOYEE_BOOTSTRAP_RESULT", result, { requestId });
        return;
      }

      if (msg.type === "UNIFORM_EMPLOYEE_SUBMIT_ORDER") {
        const result = await submitUniformEmployeeOrder({
          items: msg.items || payload.items || [],
          note: msg.note || payload.note || ""
        });
        send(html, "UNIFORM_EMPLOYEE_ORDER_SUBMITTED", result, { requestId });
        return;
      }

      if (msg.type === "UNIFORM_EMPLOYEE_ACK_POLICY") {
        const result = await acknowledgeUniformPolicy({
          policyId: msg.policyId || payload.policyId || "",
          policyVersion: msg.policyVersion || payload.policyVersion || ""
        });
        send(html, "UNIFORM_EMPLOYEE_ACK_OK", result, { requestId });
        return;
      }

      if (msg.type === "UNIFORM_EMPLOYEE_NAVIGATE") {
        const path = String(msg.path || payload.path || "");
        if (path.startsWith("/riaintra")) wixLocation.to(path);
      }
    } catch (error) {
      const message = error?.message || "Uniform Center action failed.";
      if (/staff login required/i.test(message)) {
        wixLocation.to(LOGIN_PATH);
      }
      send(html, "UNIFORM_EMPLOYEE_ERROR", {}, { requestId, message });
    }
  });
});
