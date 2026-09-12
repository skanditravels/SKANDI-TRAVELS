// /src/pages/Success Factors.sh6tw.js
// B-008 — clean SuccessFactors page bridge.
// One backend dependency only. No Payroll business methods and no RIAINTRA chrome duplication.

import wixLocation from "wix-location";
import {
  getEmployeeWorkspace,
  getManagerCandidates,
  getOrgStructureBootstrap,
  provisionStaffOrganization
} from "backend/SKANDI_CORE/orgStructure.web";

const EMBED_ID = "#staffHrEmbed";
const CHILD_SOURCE = "SKANDI_SUCCESSFACTORS";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
const LOGIN_PATH = "/riaintra";

function send(type, payload = {}) {
  $w(EMBED_ID).postMessage({
    source: PARENT_SOURCE,
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function internalPath(value) {
  const path = String(value || "").trim();
  return path === LOGIN_PATH || path.startsWith(`${LOGIN_PATH}/`) ? path : "";
}

async function bootstrap() {
  const data = await getOrgStructureBootstrap();
  send("HR_ORG_CATALOG", data);
}

$w.onReady(function () {
  const embed = $w(EMBED_ID);
  embed.onMessage(async (event) => {
    const message = event.data || {};
    if (message.source && message.source !== CHILD_SOURCE) return;
    const type = String(message.type || "");
    const payload = message.payload || {};

    try {
      if (type === "HR_READY" || type === "HR_REFRESH") {
        await bootstrap();
        return;
      }
      if (type === "HR_GET_EMPLOYEE") {
        send("HR_EMPLOYEE_WORKSPACE", await getEmployeeWorkspace(payload));
        return;
      }
      if (type === "HR_GET_MANAGER_CANDIDATES") {
        send("HR_MANAGER_CANDIDATES", await getManagerCandidates(payload));
        return;
      }
      if (type === "HR_PROVISION_ORGANIZATION") {
        const result = await provisionStaffOrganization(payload);
        send("HR_EMPLOYEE_WORKSPACE", result);
        await bootstrap();
        return;
      }
      if (type === "HR_NAVIGATE") {
        const path = internalPath(payload.path);
        if (path) wixLocation.to(path);
      }
    } catch (error) {
      send("HR_ERROR", {
        action: type,
        code: error?.code || "HR_ACTION_FAILED",
        message: error?.message || "The HR action could not be completed."
      });
    }
  });
});
