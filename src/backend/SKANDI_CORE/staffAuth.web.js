// /src/backend/SKANDI_CORE/staffAuth.web.js
// SKANDI Backend Base 1.0 — only frontend-callable staff-auth boundary.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  loginStaffWithSkIdCore,
  getStaffPortalSessionCore,
  getPortalAppsCore,
  getAlteaLaunchpadAppsCore
} from "backend/SKANDI_CORE/staffAuth.js";

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
