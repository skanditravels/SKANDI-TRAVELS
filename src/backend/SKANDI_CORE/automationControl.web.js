// /src/backend/SKANDI_CORE/automationControl.web.js
// SKANDI V12 — frontend-callable facade for authorized Wix Automations administration metadata.

import { webMethod, Permissions } from "@wix/web-methods";
import { getAutomationAdminSnapshotCore } from "backend/SKANDI_CORE/automationControl";

export const getAutomationAdminSnapshot = webMethod(
  Permissions.SiteMember,
  () => getAutomationAdminSnapshotCore()
);
