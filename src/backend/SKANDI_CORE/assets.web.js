// /src/backend/SKANDI_CORE/assets.web.js
// Canonical web-method facade for the SKANDI Platform Asset Library.

import { webMethod, Permissions } from "wix-web-module";
import {
  listAssetsCore,checkAssetDuplicateCore,prepareAssetUploadCore,finalizeAssetUploadCore,
  getAssetAccessUrlCore,registerAssetUsageCore,archiveAssetCore
} from "./assets.js";

export const listAssets=webMethod(Permissions.SiteMember,listAssetsCore);
export const checkAssetDuplicate=webMethod(Permissions.SiteMember,checkAssetDuplicateCore);
export const prepareAssetUpload=webMethod(Permissions.SiteMember,prepareAssetUploadCore);
export const finalizeAssetUpload=webMethod(Permissions.SiteMember,finalizeAssetUploadCore);
export const getAssetAccessUrl=webMethod(Permissions.SiteMember,getAssetAccessUrlCore);
export const registerAssetUsage=webMethod(Permissions.SiteMember,registerAssetUsageCore);
export const archiveAsset=webMethod(Permissions.SiteMember,archiveAssetCore);
