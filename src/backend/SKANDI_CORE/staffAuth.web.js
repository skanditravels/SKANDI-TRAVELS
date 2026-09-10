// /src/backend/SKANDI_CORE/staffAuth.web.js
// Canonical public web-method facade for SKANDI staff authentication.
// All business logic lives in ./staffAuth.js.

import { webMethod, Permissions } from "wix-web-module";
import {
  loginStaffWithSkIdCore,
  getStaffPortalSessionCore,
  getPortalAppsCore
} from "./staffAuth.js";

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
