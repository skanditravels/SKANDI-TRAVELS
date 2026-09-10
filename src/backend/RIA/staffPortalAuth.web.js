// /src/backend/RIA/staffPortalAuth.web.js
// TEMPORARY R-001 compatibility facade.
// Do not add business logic here. Retire after all imports use:
// backend/SKANDI_CORE/staffAuth.web

import { webMethod, Permissions } from "wix-web-module";
import {
  loginStaffWithSkIdCore,
  getStaffPortalSessionCore,
  getPortalAppsCore
} from "../SKANDI_CORE/staffAuth.js";

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
