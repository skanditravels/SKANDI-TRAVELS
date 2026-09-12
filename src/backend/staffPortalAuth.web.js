// /src/backend/staffPortalAuth.web.js
// TEMPORARY legacy-path compatibility facade — R-003.9.4.
// Zero business logic. New/current consumers must import:
// backend/SKANDI_CORE/staffAuth.web

import { Permissions, webMethod } from "@wix/web-methods";
import {
  loginStaffWithSkIdCore,
  getStaffPortalSessionCore,
  getPortalAppsCore
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
