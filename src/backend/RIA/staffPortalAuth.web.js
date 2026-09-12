// /src/backend/RIA/staffPortalAuth.web.js
// SKANDI Staff Portal Auth — canonical web compatibility boundary.
// R-003.8
//
// No identity or authorization logic belongs in this file. All logic lives in
// SKANDI_CORE/staffAuth.js and reads Supabase as the single staff source.

import { webMethod, Permissions } from "wix-web-module";
import {
  loginStaffWithSkIdCore,
  getStaffPortalSessionCore,
  getPortalAppsCore,
  getAlteaLaunchpadAppsCore
} from "backend//SKANDI_CORE/staffAuth.js";

export const loginStaffWithSkId = webMethod(
  Permissions.Anyone,
  loginStaffWithSkIdCore
);

export const getStaffPortalSession = webMethod(
  Permissions.Anyone,
  getStaffPortalSessionCore
);

export const getPortalApps = webMethod(
  Permissions.SiteMember,
  getPortalAppsCore
);

export const getAlteaLaunchpadApps = webMethod(
  Permissions.SiteMember,
  getAlteaLaunchpadAppsCore
);
