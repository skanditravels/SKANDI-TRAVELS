// /src/backend/SKANDI_CORE/automationControl.web.js
// SKANDI V12 — frontend-callable facade for authorized Wix Automations administration.

import { webMethod, Permissions } from "@wix/web-methods";
import {
  generateAutomationEmailActionMappingCore,
  getAutomationAdminSnapshotCore,
  getAutomationEmailPlatformSnapshotCore,
  inspectAutomationEmailActionCore,
  previewAutomationEmailActionCore,
  syncAutomationEmailActionCore
} from "backend/SKANDI_CORE/automationControl";

export const getAutomationAdminSnapshot = webMethod(
  Permissions.SiteMember,
  () => getAutomationAdminSnapshotCore()
);

export const getAutomationEmailPlatformSnapshot = webMethod(
  Permissions.SiteMember,
  () => getAutomationEmailPlatformSnapshotCore()
);

export const inspectAutomationEmailAction = webMethod(
  Permissions.SiteMember,
  options => inspectAutomationEmailActionCore(options)
);

export const previewAutomationEmailAction = webMethod(
  Permissions.SiteMember,
  options => previewAutomationEmailActionCore(options)
);

export const syncAutomationEmailAction = webMethod(
  Permissions.SiteMember,
  options => syncAutomationEmailActionCore(options)
);

export const generateAutomationEmailActionMapping = webMethod(
  Permissions.SiteMember,
  options => generateAutomationEmailActionMappingCore(options)
);
