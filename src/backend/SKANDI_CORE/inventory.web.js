// /src/backend/SKANDI_CORE/inventory.web.js
// SKANDI Inventory Control — canonical page-callable facade.
// R-003.11 — Runtime facade convergence.
//
// This file intentionally contains NO Inventory, Asset Library, Supabase, or
// Duffel business logic. It keeps the proven Wix web-module runtime boundary
// while exposing the complete canonical SKANDI_CORE Inventory surface.

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

// Inventory master/reference records.
export const getInventoryBootstrap = webMethod(MEMBER, getInventoryBootstrapCore);
export const getInventoryRecord = webMethod(MEMBER, getInventoryRecordCore);
export const saveInventoryBundle = webMethod(MEMBER, saveInventoryBundleCore);
export const archiveInventoryRecord = webMethod(MEMBER, archiveInventoryRecordCore);

// Dated capacity and pricing.
export const getDatedInventory = webMethod(MEMBER, getDatedInventoryCore);
export const saveDatedInventory = webMethod(MEMBER, saveDatedInventoryCore);
export const deleteDatedInventory = webMethod(MEMBER, deleteDatedInventoryCore);

// Air inventory / revenue control.
export const getAirInventory = webMethod(MEMBER, getAirInventoryCore);
export const saveAirInventoryRow = webMethod(MEMBER, saveAirInventoryRowCore);

// Aircraft & Cabin Studio.
export const getAircraftBootstrap = webMethod(MEMBER, getAircraftBootstrapCore);
export const getAircraftRecord = webMethod(MEMBER, getAircraftRecordCore);
export const saveAircraft = webMethod(MEMBER, saveAircraftCore);
export const archiveAircraft = webMethod(MEMBER, archiveAircraftCore);
export const saveAircraftChild = webMethod(MEMBER, saveAircraftChildCore);
export const archiveAircraftChild = webMethod(MEMBER, archiveAircraftChildCore);
export const smartSyncAircraft = webMethod(MEMBER, smartSyncAircraftCore);
export const getCabinNormalizationPreview = webMethod(MEMBER, getCabinNormalizationPreviewCore);

// Audit / QA.
export const getInventoryAudit = webMethod(MEMBER, getInventoryAuditCore);
export const getInventoryQuality = webMethod(MEMBER, getInventoryQualityCore);

// Duffel reference / SKANDI Collection orchestration.
export const searchInventoryProvider = webMethod(MEMBER, searchInventoryProviderCore);
export const getInventoryProviderResource = webMethod(MEMBER, getInventoryProviderResourceCore);
export const importInventoryProviderResource = webMethod(MEMBER, importInventoryProviderResourceCore);
export const refreshInventoryProviderResource = webMethod(MEMBER, refreshInventoryProviderResourceCore);

// Duffel negotiated Stays rates.
export const listInventoryNegotiatedRates = webMethod(MEMBER, listInventoryNegotiatedRatesCore);
export const getInventoryNegotiatedRate = webMethod(MEMBER, getInventoryNegotiatedRateCore);
export const createInventoryNegotiatedRate = webMethod(MEMBER, createInventoryNegotiatedRateCore);
export const updateInventoryNegotiatedRate = webMethod(MEMBER, updateInventoryNegotiatedRateCore);
export const deleteInventoryNegotiatedRate = webMethod(MEMBER, deleteInventoryNegotiatedRateCore);

// Platform Asset Library exposed through the same Inventory facade so the Wix
// page retains exactly one backend dependency.
export const listAssetLibrary = webMethod(MEMBER, listAssetsCore);
export const checkAssetLibraryDuplicate = webMethod(MEMBER, checkAssetDuplicateCore);
export const prepareAssetLibraryUpload = webMethod(MEMBER, prepareAssetUploadCore);
export const finalizeAssetLibraryUpload = webMethod(MEMBER, finalizeAssetUploadCore);
export const getAssetLibraryAccessUrl = webMethod(MEMBER, getAssetAccessUrlCore);
export const registerAssetLibraryUsage = webMethod(MEMBER, registerAssetUsageCore);
export const archiveAssetLibraryItem = webMethod(MEMBER, archiveAssetCore);
