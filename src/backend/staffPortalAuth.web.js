// /src/backend/staffPortalAuth.web.js
// SKANDI Staff Portal Auth — legacy import-path compatibility facade.
// R-003.8
//
// DEPRECATED PATH: new/current page code must import
// "backend/RIA/staffPortalAuth.web".
//
// This file contains no authentication or authorization logic. It temporarily
// preserves older page imports while the project is converged on the RIA path.

export {
  loginStaffWithSkId,
  getStaffPortalSession,
  getPortalApps,
  getAlteaLaunchpadApps
} from "./RIA/staffPortalAuth.web.js";
