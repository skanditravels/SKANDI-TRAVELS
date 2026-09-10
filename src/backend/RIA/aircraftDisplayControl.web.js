// /src/backend/RIA/aircraftDisplayControl.web.js
// TEMPORARY R-003 compatibility facade.
// Aircraft Display Control is no longer a separate writer.
// All aircraft/cabin logic is owned by SKANDI_CORE Inventory.

import { webMethod, Permissions } from "wix-web-module";
import {
  getAircraftBootstrapCore,getAircraftRecordCore,saveAircraftCore,archiveAircraftCore,
  saveAircraftChildCore,archiveAircraftChildCore,smartSyncAircraftCore,getCabinNormalizationPreviewCore
} from "../SKANDI_CORE/inventory.js";

export const getAircraftControlBootstrap=webMethod(Permissions.SiteMember,getAircraftBootstrapCore);
export const getAircraftControlRecord=webMethod(Permissions.SiteMember,getAircraftRecordCore);
export const saveAircraftControl=webMethod(Permissions.SiteMember,saveAircraftCore);
export const archiveAircraftControl=webMethod(Permissions.SiteMember,archiveAircraftCore);
export const saveAircraftControlChild=webMethod(Permissions.SiteMember,saveAircraftChildCore);
export const archiveAircraftControlChild=webMethod(Permissions.SiteMember,archiveAircraftChildCore);
export const smartFillAircraft=webMethod(Permissions.SiteMember,smartSyncAircraftCore);
export const smartSyncAllAircraft=webMethod(Permissions.SiteMember,smartSyncAircraftCore);
export const getCabinNormalizationPreview=webMethod(Permissions.SiteMember,getCabinNormalizationPreviewCore);
