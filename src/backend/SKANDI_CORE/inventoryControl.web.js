// /src/backend/SKANDI_CORE/inventoryControl.web.js
// SKANDI Inventory Control — canonical web boundary.
// R-003.8
//
// This file intentionally contains no Inventory business logic. The single
// Inventory page boundary delegates to SKANDI_CORE and exposes the central
// Asset Library through the same facade so the Wix page keeps one backend
// dependency.

import { webMethod, Permissions } from "wix-web-module";
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
} from "./inventory.js";
import {
  listAssetsCore,
  checkAssetDuplicateCore,
  prepareAssetUploadCore,
  finalizeAssetUploadCore,
  getAssetAccessUrlCore,
  registerAssetUsageCore,
  archiveAssetCore
} from "./assets.js";

const MEMBER = Permissions.SiteMember;

export const getInventoryBootstrap = webMethod(MEMBER, getInventoryBootstrapCore);
export const getInventoryRecord = webMethod(MEMBER, getInventoryRecordCore);
export const saveInventoryBundle = webMethod(MEMBER, saveInventoryBundleCore);
export const archiveInventoryRecord = webMethod(MEMBER, archiveInventoryRecordCore);

export const getDatedInventory = webMethod(MEMBER, getDatedInventoryCore);
export const saveDatedInventory = webMethod(MEMBER, saveDatedInventoryCore);
export const deleteDatedInventory = webMethod(MEMBER, deleteDatedInventoryCore);

export const getAirInventory = webMethod(MEMBER, getAirInventoryCore);
export const saveAirInventoryRow = webMethod(MEMBER, saveAirInventoryRowCore);

export const getAircraftBootstrap = webMethod(MEMBER, getAircraftBootstrapCore);
export const getAircraftRecord = webMethod(MEMBER, getAircraftRecordCore);
export const saveAircraft = webMethod(MEMBER, saveAircraftCore);
export const archiveAircraft = webMethod(MEMBER, archiveAircraftCore);
export const saveAircraftChild = webMethod(MEMBER, saveAircraftChildCore);
export const archiveAircraftChild = webMethod(MEMBER, archiveAircraftChildCore);
export const smartSyncAircraft = webMethod(MEMBER, smartSyncAircraftCore);
export const getCabinNormalizationPreview = webMethod(MEMBER, getCabinNormalizationPreviewCore);

export const getInventoryAudit = webMethod(MEMBER, getInventoryAuditCore);
export const getInventoryQuality = webMethod(MEMBER, getInventoryQualityCore);

export const searchInventoryProvider = webMethod(MEMBER, searchInventoryProviderCore);
export const getInventoryProviderResource = webMethod(MEMBER, getInventoryProviderResourceCore);
export const importInventoryProviderResource = webMethod(MEMBER, importInventoryProviderResourceCore);
export const refreshInventoryProviderResource = webMethod(MEMBER, refreshInventoryProviderResourceCore);

export const listInventoryNegotiatedRates = webMethod(MEMBER, listInventoryNegotiatedRatesCore);
export const getInventoryNegotiatedRate = webMethod(MEMBER, getInventoryNegotiatedRateCore);
export const createInventoryNegotiatedRate = webMethod(MEMBER, createInventoryNegotiatedRateCore);
export const updateInventoryNegotiatedRate = webMethod(MEMBER, updateInventoryNegotiatedRateCore);
export const deleteInventoryNegotiatedRate = webMethod(MEMBER, deleteInventoryNegotiatedRateCore);

export const listAssetLibrary = webMethod(MEMBER, listAssetsCore);
export const checkAssetLibraryDuplicate = webMethod(MEMBER, checkAssetDuplicateCore);
export const prepareAssetLibraryUpload = webMethod(MEMBER, prepareAssetUploadCore);
export const finalizeAssetLibraryUpload = webMethod(MEMBER, finalizeAssetUploadCore);
export const getAssetLibraryAccessUrl = webMethod(MEMBER, getAssetAccessUrlCore);
export const registerAssetLibraryUsage = webMethod(MEMBER, registerAssetUsageCore);
export const archiveAssetLibraryItem = webMethod(MEMBER, archiveAssetCore);
