// /src/backend/SKANDI_CORE/inventoryControl.web.js
// SKANDI Inventory Control — canonical page-callable facade.
// R-003.13 — runtime recovery facade; R-003.9.3 @wix/web-methods contract preserved.
//
// One frontend-callable Inventory facade. No Inventory, Supabase, Asset Library,
// or Duffel business logic lives here. All domain logic remains in SKANDI_CORE.

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

// Inventory master/reference records.
export const getInventoryBootstrap = memberMethod(getInventoryBootstrapCore);
export const getInventoryRecord = memberMethod(getInventoryRecordCore);
export const saveInventoryBundle = memberMethod(saveInventoryBundleCore);
export const archiveInventoryRecord = memberMethod(archiveInventoryRecordCore);

// Dated capacity and pricing.
export const getDatedInventory = memberMethod(getDatedInventoryCore);
export const saveDatedInventory = memberMethod(saveDatedInventoryCore);
export const deleteDatedInventory = memberMethod(deleteDatedInventoryCore);

// Air inventory / revenue control.
export const getAirInventory = memberMethod(getAirInventoryCore);
export const saveAirInventoryRow = memberMethod(saveAirInventoryRowCore);

// Aircraft & Cabin Studio.
export const getAircraftBootstrap = memberMethod(getAircraftBootstrapCore);
export const getAircraftRecord = memberMethod(getAircraftRecordCore);
export const saveAircraft = memberMethod(saveAircraftCore);
export const archiveAircraft = memberMethod(archiveAircraftCore);
export const saveAircraftChild = memberMethod(saveAircraftChildCore);
export const archiveAircraftChild = memberMethod(archiveAircraftChildCore);
export const smartSyncAircraft = memberMethod(smartSyncAircraftCore);
export const getCabinNormalizationPreview = memberMethod(getCabinNormalizationPreviewCore);

// Audit / QA.
export const getInventoryAudit = memberMethod(getInventoryAuditCore);
export const getInventoryQuality = memberMethod(getInventoryQualityCore);

// Duffel reference / SKANDI Collection orchestration.
export const searchInventoryProvider = memberMethod(searchInventoryProviderCore);
export const getInventoryProviderResource = memberMethod(getInventoryProviderResourceCore);
export const importInventoryProviderResource = memberMethod(importInventoryProviderResourceCore);
export const refreshInventoryProviderResource = memberMethod(refreshInventoryProviderResourceCore);

// Duffel negotiated Stays rates.
export const listInventoryNegotiatedRates = memberMethod(listInventoryNegotiatedRatesCore);
export const getInventoryNegotiatedRate = memberMethod(getInventoryNegotiatedRateCore);
export const createInventoryNegotiatedRate = memberMethod(createInventoryNegotiatedRateCore);
export const updateInventoryNegotiatedRate = memberMethod(updateInventoryNegotiatedRateCore);
export const deleteInventoryNegotiatedRate = memberMethod(deleteInventoryNegotiatedRateCore);

// Platform Asset Library through the same Inventory facade.
export const listAssetLibrary = memberMethod(listAssetsCore);
export const checkAssetLibraryDuplicate = memberMethod(checkAssetDuplicateCore);
export const prepareAssetLibraryUpload = memberMethod(prepareAssetUploadCore);
export const finalizeAssetLibraryUpload = memberMethod(finalizeAssetUploadCore);
export const getAssetLibraryAccessUrl = memberMethod(getAssetAccessUrlCore);
export const registerAssetLibraryUsage = memberMethod(registerAssetUsageCore);
export const archiveAssetLibraryItem = memberMethod(archiveAssetCore);
