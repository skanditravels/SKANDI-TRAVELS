// /src/backend/SKANDI_CORE/mediaControl.web.js
// V12 Media Control — single stable frontend-callable Asset Library dispatch boundary.
// Business logic remains owned by backend/SKANDI_CORE/assets.js.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  listAssetsCore,
  checkAssetDuplicateCore,
  prepareAssetUploadCore,
  finalizeAssetUploadCore,
  getAssetAccessUrlCore,
  registerAssetUsageCore,
  archiveAssetCore
} from "backend/SKANDI_CORE/assets";

const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const clean = value => String(value || "").trim().toUpperCase();

const ACTIONS = Object.freeze({
  LIST_ASSETS: listAssetsCore,
  CHECK_DUPLICATE: checkAssetDuplicateCore,
  PREPARE_UPLOAD: prepareAssetUploadCore,
  FINALIZE_UPLOAD: finalizeAssetUploadCore,
  GET_ACCESS_URL: getAssetAccessUrlCore,
  REGISTER_USAGE: registerAssetUsageCore,
  ARCHIVE_ASSET: archiveAssetCore
});

export const handleMediaControlAssetAction = webMethod(
  Permissions.SiteMember,
  async input => {
    const request = object(input);
    const action = clean(request.action);
    const handler = ACTIONS[action];
    if (!handler) {
      const error = new Error("MEDIA_CONTROL_ASSET_ACTION_UNSUPPORTED");
      error.code = "MEDIA_CONTROL_ASSET_ACTION_UNSUPPORTED";
      throw error;
    }
    return handler(object(request.payload));
  }
);
