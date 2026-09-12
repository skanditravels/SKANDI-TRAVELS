// /src/backend/SKANDI_CORE/inventoryControl.web.js
// SKANDI Inventory Control — canonical web boundary.
// R-003.9.3
//
// One frontend-callable Inventory facade. No Inventory business logic lives
// here. All domain logic remains in SKANDI_CORE cores.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  getInventoryBootstrapCore,
  getInventoryRecordCore,
  saveInventoryBundleCore,
  archiveInventoryRecordCore,
  getDatedInventoryCore,
  saveDatedInventoryCore,
  deleteDatedInventoryCore,
  getAirInventoryCore,
  saveAirInventoryRowCore,
  getAircraftBootstrapCore,
  getAircraftRecordCore,
  saveAircraftCore,
  archiveAircraftCore,
  saveAircraftChildCore,
  archiveAircraftChildCore,
  smartSyncAircraftCore,
  getCabinNormalizationPreviewCore,
  getInventoryAuditCore,
  getInventoryQualityCore,
  searchInventoryProviderCore,
  getInventoryProviderResourceCore,
  importInventoryProviderResourceCore,
  refreshInventoryProviderResourceCore,
  listInventoryNegotiatedRatesCore,
  getInventoryNegotiatedRateCore,
  createInventoryNegotiatedRateCore,
  updateInventoryNegotiatedRateCore,
  deleteInventoryNegotiatedRateCore
} from "backend/SKANDI_CORE/inventory.js";
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
const memberMethod = handler => webMethod(MEMBER, input => handler(asInput(input)));

export const getInventoryBootstrap = memberMethod(getInventoryBootstrapCore);
export const getInventoryRecord = memberMethod(getInventoryRecordCore);
export const saveInventoryBundle = memberMethod(saveInventoryBundleCore);
export const archiveInventoryRecord = memberMethod(archiveInventoryRecordCore);

export const getDatedInventory = memberMethod(getDatedInventoryCore);
export const saveDatedInventory = memberMethod(saveDatedInventoryCore);
export const deleteDatedInventory = memberMethod(deleteDatedInventoryCore);

export const getAirInventory = memberMethod(getAirInventoryCore);
export const saveAirInventoryRow = memberMethod(saveAirInventoryRowCore);

export const getAircraftBootstrap = memberMethod(getAircraftBootstrapCore);
export const getAircraftRecord = memberMethod(getAircraftRecordCore);
export const saveAircraft = memberMethod(saveAircraftCore);
export const archiveAircraft = memberMethod(archiveAircraftCore);
export const saveAircraftChild = memberMethod(saveAircraftChildCore);
export const archiveAircraftChild = memberMethod(archiveAircraftChildCore);
export const smartSyncAircraft = memberMethod(smartSyncAircraftCore);
export const getCabinNormalizationPreview = memberMethod(getCabinNormalizationPreviewCore);

export const getInventoryAudit = memberMethod(getInventoryAuditCore);
export const getInventoryQuality = memberMethod(getInventoryQualityCore);

export const searchInventoryProvider = memberMethod(searchInventoryProviderCore);
export const getInventoryProviderResource = memberMethod(getInventoryProviderResourceCore);
export const importInventoryProviderResource = memberMethod(importInventoryProviderResourceCore);
export const refreshInventoryProviderResource = memberMethod(refreshInventoryProviderResourceCore);

export const listInventoryNegotiatedRates = memberMethod(listInventoryNegotiatedRatesCore);
export const getInventoryNegotiatedRate = memberMethod(getInventoryNegotiatedRateCore);
export const createInventoryNegotiatedRate = memberMethod(createInventoryNegotiatedRateCore);
export const updateInventoryNegotiatedRate = memberMethod(updateInventoryNegotiatedRateCore);
export const deleteInventoryNegotiatedRate = memberMethod(deleteInventoryNegotiatedRateCore);

export const listAssetLibrary = memberMethod(listAssetsCore);
export const checkAssetLibraryDuplicate = memberMethod(checkAssetDuplicateCore);
export const prepareAssetLibraryUpload = memberMethod(prepareAssetUploadCore);
export const finalizeAssetLibraryUpload = memberMethod(finalizeAssetUploadCore);
export const getAssetLibraryAccessUrl = memberMethod(getAssetAccessUrlCore);
export const registerAssetLibraryUsage = memberMethod(registerAssetUsageCore);
export const archiveAssetLibraryItem = memberMethod(archiveAssetCore);
