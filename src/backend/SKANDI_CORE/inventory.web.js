// /src/backend/SKANDI_CORE/inventory.web.js
// Canonical Inventory Control web-method facade.
// All Inventory business logic lives in ./inventory.js.

import { webMethod, Permissions } from "wix-web-module";
import {
  getInventoryBootstrapCore,getInventoryRecordCore,saveInventoryBundleCore,archiveInventoryRecordCore,
  getDatedInventoryCore,saveDatedInventoryCore,deleteDatedInventoryCore,
  getAirInventoryCore,saveAirInventoryRowCore,
  getAircraftBootstrapCore,getAircraftRecordCore,saveAircraftCore,archiveAircraftCore,
  saveAircraftChildCore,archiveAircraftChildCore,smartSyncAircraftCore,getCabinNormalizationPreviewCore,
  getInventoryAuditCore,getInventoryQualityCore
} from "./inventory.js";

export const getInventoryBootstrap=webMethod(Permissions.SiteMember,getInventoryBootstrapCore);
export const getInventoryRecord=webMethod(Permissions.SiteMember,getInventoryRecordCore);
export const saveInventoryBundle=webMethod(Permissions.SiteMember,saveInventoryBundleCore);
export const archiveInventoryRecord=webMethod(Permissions.SiteMember,archiveInventoryRecordCore);
export const getDatedInventory=webMethod(Permissions.SiteMember,getDatedInventoryCore);
export const saveDatedInventory=webMethod(Permissions.SiteMember,saveDatedInventoryCore);
export const deleteDatedInventory=webMethod(Permissions.SiteMember,deleteDatedInventoryCore);
export const getAirInventory=webMethod(Permissions.SiteMember,getAirInventoryCore);
export const saveAirInventoryRow=webMethod(Permissions.SiteMember,saveAirInventoryRowCore);
export const getAircraftBootstrap=webMethod(Permissions.SiteMember,getAircraftBootstrapCore);
export const getAircraftRecord=webMethod(Permissions.SiteMember,getAircraftRecordCore);
export const saveAircraft=webMethod(Permissions.SiteMember,saveAircraftCore);
export const archiveAircraft=webMethod(Permissions.SiteMember,archiveAircraftCore);
export const saveAircraftChild=webMethod(Permissions.SiteMember,saveAircraftChildCore);
export const archiveAircraftChild=webMethod(Permissions.SiteMember,archiveAircraftChildCore);
export const smartSyncAircraft=webMethod(Permissions.SiteMember,smartSyncAircraftCore);
export const getCabinNormalizationPreview=webMethod(Permissions.SiteMember,getCabinNormalizationPreviewCore);
export const getInventoryAudit=webMethod(Permissions.SiteMember,getInventoryAuditCore);
export const getInventoryQuality=webMethod(Permissions.SiteMember,getInventoryQualityCore);
