import wixLocation from "wix-location";
import { getStaffPortalSession } from "backend/RIA/staffPortalAuth.web";

import {
  getUniformEmployeeBootstrap,
  submitUniformEmployeeOrder,
  acknowledgeUniformPolicy
} from "backend/uniformCenterCms.web";

const HTML_ID = "#uniformCenterEmbed";
const CHILD_SOURCE = "SKANDI_UNIFORM_EMPLOYEE";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const LOGIN_PATH = "/riaintra";

function post(html, type, payload = {}) {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    payload: payload || {},
    timestamp: new Date().toISOString()
  });
}

function postFlat(html, type, payload = {}) {
  html.postMessage({
    source: PARENT_SOURCE,
    type,
    ...(payload || {}),
    timestamp: new Date().toISOString()
  });
}

async function requirePortalSession() {
  const session = await getStaffPortalSession().catch(() => null);

  if (!session || session.authorized === false || session.ok === false) {
    wixLocation.to(LOGIN_PATH);
    return null;
  }

  return session;
}

async function bootstrap(html) {
  const portalSession = await requirePortalSession();

  if (!portalSession) {
    return;
  }

  const payload = await getUniformEmployeeBootstrap();
  postFlat(html, "UNIFORM_EMPLOYEE_BOOTSTRAP_RESULT", { payload });
}

$w.onReady(function () {
  const html = $w(HTML_ID);

  html.onMessage(async (event) => {
    const msg = event.data || {};
    const source = msg.source || "";
    const type = msg.type || "";
    const payload = msg.payload || {};

    if (source !== CHILD_SOURCE) {
      return;
    }

    try {
      if (type === "UNIFORM_EMPLOYEE_READY" || type === "UNIFORM_EMPLOYEE_BOOTSTRAP") {
        await bootstrap(html);
        return;
      }

      if (type === "UNIFORM_EMPLOYEE_SUBMIT_ORDER") {
        const result = await submitUniformEmployeeOrder({
          items: msg.items || payload.items || [],
          note: msg.note || payload.note || ""
        });
        postFlat(html, "UNIFORM_EMPLOYEE_ORDER_SUBMITTED", { payload: result });
        return;
      }

      if (type === "UNIFORM_EMPLOYEE_ACK_POLICY") {
        const result = await acknowledgeUniformPolicy({
          policyId: msg.policyId || payload.policyId || "",
          policyVersion: msg.policyVersion || payload.policyVersion || ""
        });
        postFlat(html, "UNIFORM_EMPLOYEE_ACK_OK", { payload: result });
      }
    } catch (error) {
      postFlat(html, "UNIFORM_EMPLOYEE_ERROR", {
        message: error.message || "Uniform Shop action failed."
      });
    }
  });
});
