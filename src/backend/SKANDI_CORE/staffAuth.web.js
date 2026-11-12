// /src/backend/SKANDI_CORE/staffAuth.web.js
// SKANDI Backend Base 1.0 — only frontend-callable staff-auth boundary.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  getStaffPortalSessionCore,
  getPortalAppsCore,
  getAlteaLaunchpadAppsCore
} from "backend/SKANDI_CORE/staffAuth";

export const loginStaffWithSkId = webMethod(
  Permissions.Anyone,
  async () => ({
    ok: false,
    code: "DEVICE_VERIFICATION_REQUIRED",
    message: "Use the current RIAINTRA sign-in page to verify your device."
  })
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
