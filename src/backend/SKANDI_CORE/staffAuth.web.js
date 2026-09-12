// /src/backend/SKANDI_CORE/staffAuth.web.js
// SKANDI Staff Authentication — canonical Wix web-method facade.
// R-003.9.4
// Business/authorization logic lives only in backend/SKANDI_CORE/staffAuth.js.

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
