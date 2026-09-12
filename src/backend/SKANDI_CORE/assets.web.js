// /src/backend/SKANDI_CORE/assets.web.js
// SKANDI Backend Base 1.0 — B-003 global Asset Library web boundary.
// Inventory intentionally reuses the same core through inventory.web.js so its page has one backend dependency.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  listAssetsCore,
  checkAssetDuplicateCore,
  prepareAssetUploadCore,
  finalizeAssetUploadCore,
  getAssetAccessUrlCore,
  registerAssetUsageCore,
  archiveAssetCore
} from "backend/SKANDI_CORE/assets.js";

const MEMBER = Permissions.SiteMember;
const asInput = value => value && typeof value === "object" ? value : {};
const memberMethod = handler => webMethod(MEMBER, value => handler(asInput(value)));

export const listAssets = memberMethod(listAssetsCore);
export const checkAssetDuplicate = memberMethod(checkAssetDuplicateCore);
export const prepareAssetUpload = memberMethod(prepareAssetUploadCore);
export const finalizeAssetUpload = memberMethod(finalizeAssetUploadCore);
export const getAssetAccessUrl = memberMethod(getAssetAccessUrlCore);
export const registerAssetUsage = memberMethod(registerAssetUsageCore);
export const archiveAsset = memberMethod(archiveAssetCore);
