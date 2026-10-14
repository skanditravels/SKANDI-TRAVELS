// /src/backend/SKANDI_CORE/opsControl.web.js
// V12 — OPS Control frontend web-method boundary.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  getOpsControlBootstrapCore,
  handleOpsControlActionCore
} from "backend/SKANDI_CORE/opsControl";

function publicError(error) {
  const code = String(error?.code || error?.message || "OPS_CONTROL_FAILED").toUpperCase().replace(/[^A-Z0-9_]/g, "_").slice(0, 100) || "OPS_CONTROL_FAILED";
  const out = new Error(String(error?.publicMessage || error?.message || "OPS Control request failed.").slice(0, 500));
  out.name = "OpsControlError";
  out.code = code;
  out.publicMessage = out.message;
  return out;
}

async function call(handler, input = {}) {
  try {
    return await handler(input || {});
  } catch (error) {
    throw publicError(error);
  }
}

export const getOpsControlBootstrap = webMethod(
  Permissions.SiteMember,
  input => call(getOpsControlBootstrapCore, input)
);

export const handleOpsControlAction = webMethod(
  Permissions.SiteMember,
  input => call(handleOpsControlActionCore, input)
);
