// /src/backend/SKANDI_CORE/uniform.web.js
// SKANDI Uniform Domain — canonical single-dispatch Wix web facade.
// B-011.28 — shared by Employee Uniform Center and administrative Uniform Control.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  UNIFORM_CORE_VERSION,
  getUniformAdminBootstrapCore,
  saveUniformCatalogItemCore,
  saveUniformCategoryCore,
  saveUniformAllowanceRuleCore,
  saveUniformPolicyCore,
  uniformOrderActionCore,
  adjustUniformWalletCore,
  archiveUniformItemCore,
  getUniformEmployeeBootstrapCore,
  submitUniformEmployeeOrderCore,
  acknowledgeUniformPolicyCore,
  getUniformRegulationsBootstrapCore,
  listUniformAssetsCore,
  checkUniformAssetDuplicateCore,
  prepareUniformAssetUploadCore,
  finalizeUniformAssetUploadCore,
  getUniformAssetAccessUrlCore,
  getUniformSystemStatusCore
} from "backend/SKANDI_CORE/uniform.js";

const MEMBER = Permissions.SiteMember;
const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const action = (responseType, handler, { refreshBootstrap = false } = {}) =>
  Object.freeze({ responseType, handler, refreshBootstrap });

const ACTIONS = Object.freeze({
  UNIFORM_SYSTEM_STATUS: action("UNIFORM_SYSTEM_STATUS_RESULT", getUniformSystemStatusCore),

  UNIFORM_EMPLOYEE_READY: action("UNIFORM_EMPLOYEE_BOOTSTRAP_RESULT", getUniformEmployeeBootstrapCore),
  UNIFORM_EMPLOYEE_BOOTSTRAP: action("UNIFORM_EMPLOYEE_BOOTSTRAP_RESULT", getUniformEmployeeBootstrapCore),
  UNIFORM_EMPLOYEE_SUBMIT_ORDER: action("UNIFORM_EMPLOYEE_ORDER_SUBMITTED", submitUniformEmployeeOrderCore, { refreshBootstrap: true }),
  UNIFORM_EMPLOYEE_ACK_POLICY: action("UNIFORM_EMPLOYEE_ACK_OK", acknowledgeUniformPolicyCore),
  UNIFORM_REGULATIONS_BOOTSTRAP: action("UNIFORM_REGULATIONS_BOOTSTRAP_RESULT", getUniformRegulationsBootstrapCore),

  UNIFORM_ADMIN_READY: action("UNIFORM_ADMIN_BOOTSTRAP_RESULT", getUniformAdminBootstrapCore),
  UNIFORM_ADMIN_BOOTSTRAP: action("UNIFORM_ADMIN_BOOTSTRAP_RESULT", getUniformAdminBootstrapCore),
  UNIFORM_ADMIN_SAVE_ITEM: action("UNIFORM_ADMIN_SAVED", saveUniformCatalogItemCore, { refreshBootstrap: true }),
  UNIFORM_ADMIN_SAVE_CATEGORY: action("UNIFORM_ADMIN_SAVED", saveUniformCategoryCore, { refreshBootstrap: true }),
  UNIFORM_ADMIN_SAVE_RULE: action("UNIFORM_ADMIN_SAVED", saveUniformAllowanceRuleCore, { refreshBootstrap: true }),
  UNIFORM_ADMIN_SAVE_POLICY: action("UNIFORM_ADMIN_SAVED", saveUniformPolicyCore, { refreshBootstrap: true }),
  UNIFORM_ADMIN_ORDER_ACTION: action("UNIFORM_ADMIN_SAVED", uniformOrderActionCore, { refreshBootstrap: true }),
  UNIFORM_ADMIN_ADJUST_WALLET: action("UNIFORM_ADMIN_SAVED", adjustUniformWalletCore, { refreshBootstrap: true }),
  // Backward-compatible old message name; now archives rather than hard-deletes.
  UNIFORM_ADMIN_DELETE: action("UNIFORM_ADMIN_SAVED", archiveUniformItemCore, { refreshBootstrap: true }),
  UNIFORM_ADMIN_ARCHIVE_ITEM: action("UNIFORM_ADMIN_SAVED", archiveUniformItemCore, { refreshBootstrap: true }),

  UNIFORM_ADMIN_ASSET_LIST: action("UNIFORM_ADMIN_ASSET_LIST_RESULT", listUniformAssetsCore),
  UNIFORM_ADMIN_ASSET_CHECK_DUPLICATE: action("UNIFORM_ADMIN_ASSET_DUPLICATE_RESULT", checkUniformAssetDuplicateCore),
  UNIFORM_ADMIN_ASSET_PREPARE_UPLOAD: action("UNIFORM_ADMIN_ASSET_UPLOAD_PREPARED", prepareUniformAssetUploadCore),
  UNIFORM_ADMIN_ASSET_FINALIZE_UPLOAD: action("UNIFORM_ADMIN_ASSET_UPLOAD_FINALIZED", finalizeUniformAssetUploadCore, { refreshBootstrap: true }),
  UNIFORM_ADMIN_ASSET_ACCESS_URL: action("UNIFORM_ADMIN_ASSET_ACCESS_URL_RESULT", getUniformAssetAccessUrlCore)
});

function safeError(error) {
  const code = String(error?.code || error?.message || "UNIFORM_ERROR").trim().slice(0, 120);
  const publicMessage = String(error?.publicMessage || "").trim().slice(0, 900);
  const fallback = {
    UNIFORM_ADMIN_ACCESS_REQUIRED: "Uniform Control admin permission required.",
    INSUFFICIENT_SK_POINTS: "Insufficient SK-Points for this action.",
    EMPLOYEE_NOT_ELIGIBLE: "Employee is not eligible for this Uniform item.",
    REPLACEMENT_NOT_ELIGIBLE: "This Uniform item is not yet eligible for replacement.",
    CONCURRENT_WALLET_CHANGE: "The wallet changed in another session. Refresh and try again.",
    CONCURRENT_ORDER_CHANGE: "The order changed in another session. Refresh and try again."
  }[code] || "Uniform request failed.";
  return { code, message: publicMessage || fallback };
}

async function dispatch(input = {}) {
  const request = object(input);
  const type = String(request.type || "").trim().toUpperCase().slice(0, 140);
  const payload = object(request.payload);
  try {
    const selected = ACTIONS[type];
    if (!selected) {
      const error = new Error("UNIFORM_ACTION_NOT_SUPPORTED");
      error.code = "UNIFORM_ACTION_NOT_SUPPORTED";
      error.publicMessage = `Uniform action is not supported: ${type || "UNKNOWN"}.`;
      throw error;
    }
    const result = await selected.handler(payload);
    return {
      ok: true,
      version: UNIFORM_CORE_VERSION,
      actionType: type,
      responseType: selected.responseType,
      refreshBootstrap: selected.refreshBootstrap === true,
      payload: object(result)
    };
  } catch (error) {
    return {
      ok: false,
      version: UNIFORM_CORE_VERSION,
      actionType: type,
      responseType: type.startsWith("UNIFORM_EMPLOYEE") ? "UNIFORM_EMPLOYEE_ERROR" : "UNIFORM_ADMIN_ERROR",
      refreshBootstrap: false,
      payload: safeError(error)
    };
  }
}

export const handleUniformAction = webMethod(MEMBER, dispatch);
