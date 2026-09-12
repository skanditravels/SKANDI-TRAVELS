// /src/backend/SKANDI_CORE/orgStructure.web.js
// B-008 — thin current Wix web-method boundary for SuccessFactors organization data.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  getEmployeeWorkspaceCore,
  getManagerCandidatesCore,
  getOrgStructureBootstrapCore,
  provisionStaffOrganizationCore
} from "backend/SKANDI_CORE/orgStructure.js";

export const getOrgStructureBootstrap = webMethod(Permissions.SiteMember, getOrgStructureBootstrapCore);
export const getEmployeeWorkspace = webMethod(Permissions.SiteMember, getEmployeeWorkspaceCore);
export const getManagerCandidates = webMethod(Permissions.SiteMember, getManagerCandidatesCore);
export const provisionStaffOrganization = webMethod(Permissions.SiteMember, provisionStaffOrganizationCore);
