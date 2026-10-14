// /src/backend/SKANDI_CORE/assets.web.js
// SKANDI Backend Base 1.0 — B-003 global Asset Library web boundary.
// Inventory intentionally reuses the same core through inventory.web.js so its page has one backend dependency.
// V12 transport repair: every frontend-callable export is declared directly with webMethod so Wix can generate stable proxies.

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

const asInput = value => value && typeof value === "object" ? value : {};

export const listAssets = webMethod(
  Permissions.SiteMember,
  value => listAssetsCore(asInput(value))
);

export const checkAssetDuplicate = webMethod(
  Permissions.SiteMember,
  value => checkAssetDuplicateCore(asInput(value))
);

export const prepareAssetUpload = webMethod(
  Permissions.SiteMember,
  value => prepareAssetUploadCore(asInput(value))
);

export const finalizeAssetUpload = webMethod(
  Permissions.SiteMember,
  value => finalizeAssetUploadCore(asInput(value))
);

export const getAssetAccessUrl = webMethod(
  Permissions.SiteMember,
  value => getAssetAccessUrlCore(asInput(value))
);

export const registerAssetUsage = webMethod(
  Permissions.SiteMember,
  value => registerAssetUsageCore(asInput(value))
);

export const archiveAsset = webMethod(
  Permissions.SiteMember,
  value => archiveAssetCore(asInput(value))
);
