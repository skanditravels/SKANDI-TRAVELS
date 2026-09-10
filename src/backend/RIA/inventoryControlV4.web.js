// /src/backend/RIA/inventoryControlV4.web.js
// TEMPORARY R-003 compatibility facade.
// Canonical implementation: /src/backend/SKANDI_CORE/inventory.js
// Do not add Inventory business logic here.

import { webMethod, Permissions } from "wix-web-module";
import {
  getInventoryBootstrapCore,getInventoryRecordCore,saveInventoryBundleCore,archiveInventoryRecordCore,
  getDatedInventoryCore,saveDatedInventoryCore,deleteDatedInventoryCore,
  getAirInventoryCore,saveAirInventoryRowCore,getInventoryAuditCore,getInventoryQualityCore,
  getAircraftBootstrapCore,getAircraftRecordCore,saveAircraftCore,archiveAircraftCore,
  saveAircraftChildCore,archiveAircraftChildCore,smartSyncAircraftCore,getCabinNormalizationPreviewCore
} from "../SKANDI_CORE/inventory.js";

// Current recovery contract
export const getInventoryBootstrap=webMethod(Permissions.SiteMember,getInventoryBootstrapCore);
export const getInventoryRecord=webMethod(Permissions.SiteMember,getInventoryRecordCore);
export const saveInventoryBundle=webMethod(Permissions.SiteMember,saveInventoryBundleCore);
export const archiveInventoryRecord=webMethod(Permissions.SiteMember,archiveInventoryRecordCore);
export const getDatedInventory=webMethod(Permissions.SiteMember,getDatedInventoryCore);
export const saveDatedInventory=webMethod(Permissions.SiteMember,saveDatedInventoryCore);
export const deleteDatedInventory=webMethod(Permissions.SiteMember,deleteDatedInventoryCore);
export const getAirInventory=webMethod(Permissions.SiteMember,getAirInventoryCore);
export const saveAirInventoryRow=webMethod(Permissions.SiteMember,saveAirInventoryRowCore);
export const getInventoryAudit=webMethod(Permissions.SiteMember,getInventoryAuditCore);
export const getInventoryQuality=webMethod(Permissions.SiteMember,getInventoryQualityCore);

// Legacy V4/V9 names intentionally forwarded to the same core.
export const getInventoryBootstrapV4=webMethod(Permissions.SiteMember,getInventoryBootstrapCore);
export const getInventoryRecordV4=webMethod(Permissions.SiteMember,getInventoryRecordCore);
export const saveInventoryBundleV4=webMethod(Permissions.SiteMember,saveInventoryBundleCore);
export const getAircraftControlBootstrap=webMethod(Permissions.SiteMember,getAircraftBootstrapCore);
export const getAircraftControlRecord=webMethod(Permissions.SiteMember,getAircraftRecordCore);
export const saveAircraftControl=webMethod(Permissions.SiteMember,saveAircraftCore);
export const archiveAircraftControl=webMethod(Permissions.SiteMember,archiveAircraftCore);
export const saveAircraftControlChild=webMethod(Permissions.SiteMember,saveAircraftChildCore);
export const archiveAircraftControlChild=webMethod(Permissions.SiteMember,archiveAircraftChildCore);
export const smartSyncAllAircraft=webMethod(Permissions.SiteMember,smartSyncAircraftCore);
export const getCabinNormalizationPreview=webMethod(Permissions.SiteMember,getCabinNormalizationPreviewCore);
