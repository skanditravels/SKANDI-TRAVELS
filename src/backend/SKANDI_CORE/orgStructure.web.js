// /src/backend/SKANDI_CORE/orgStructure.web.js
// B-011.30 — canonical SuccessFactors V9 Wix web-method boundary.
// Payroll and MyRoster/scheduling remain separate application boundaries.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  createEmployeeCore,
  createRecruitingDocumentPacketCore,
  detectRecruitingHistoryGapsCore,
  duplicateRecruitingPositionCore,
  exportRecruitingAuditCore,
  generateEmployeeSkIdCore,
  getBadgeControlCore,
  getEmployeeWorkspaceCore,
  getManagerCandidatesCore,
  getOrgStructureBootstrapCore,
  getRecruitingBootstrapCore,
  getSuccessFactorsDirectoryCore,
  getSuccessFactorsPortalBootstrapCore,
  provisionEmployeeWixMemberCore,
  provisionStaffOrganizationCore,
  publishRecruitingPositionCore,
  requestRecruitingDocumentCore,
  resendRecruitingDocumentPacketCore,
  resolveRecruitingGapCore,
  saveBadgeControlCore,
  saveRecruitingCandidateCore,
  saveRecruitingHistoryCore,
  saveRecruitingInterviewCore,
  saveRecruitingOnboardingTaskCore,
  saveRecruitingPositionCore,
  saveRecruitingSettingsCore,
  saveRecruitingTrainingCore,
  saveRecruitingVettingCore,
  saveSuccessFactorsSelfProfileCore,
  scheduleRecruitingMaintenanceCore,
  setEmployeeActiveCore,
  testRecruitingIntegrationsCore,
  updateEmployeeCore,
  updateRecruitingCandidateStageCore,
  verifyRecruitingDocumentCore,
  verifyRecruitingHistoryCore
} from "backend/SKANDI_CORE/orgStructure";

const MEMBER = Permissions.SiteMember;
const input = (value) => value && typeof value === "object" ? value : {};
const method = (handler) => webMethod(MEMBER, async (value) => handler(input(value)));

// Retain the portal-only export for older published page generations. The
// canonical B-011.30 page bootstraps from getOrgStructureBootstrap once.
export const getSuccessFactorsPortalBootstrap = webMethod(
  MEMBER,
  async () => getSuccessFactorsPortalBootstrapCore()
);
export const getSuccessFactorsDirectory = method(getSuccessFactorsDirectoryCore);
export const saveSuccessFactorsSelfProfile = method(saveSuccessFactorsSelfProfileCore);

export const getOrgStructureBootstrap = method(getOrgStructureBootstrapCore);
export const getEmployeeWorkspace = method(getEmployeeWorkspaceCore);
export const getManagerCandidates = method(getManagerCandidatesCore);
export const provisionStaffOrganization = method(provisionStaffOrganizationCore);
export const generateEmployeeSkId = method(generateEmployeeSkIdCore);
export const createEmployee = method(createEmployeeCore);
export const updateEmployee = method(updateEmployeeCore);
export const setEmployeeActive = method(setEmployeeActiveCore);
export const provisionEmployeeWixMember = method(provisionEmployeeWixMemberCore);

export const getBadgeControl = method(getBadgeControlCore);
export const saveBadgeControl = method(saveBadgeControlCore);

export const getRecruitingBootstrap = method(getRecruitingBootstrapCore);
export const saveRecruitingCandidate = method(saveRecruitingCandidateCore);
export const updateRecruitingCandidateStage = method(updateRecruitingCandidateStageCore);
export const saveRecruitingPosition = method(saveRecruitingPositionCore);
export const publishRecruitingPosition = method(publishRecruitingPositionCore);
export const duplicateRecruitingPosition = method(duplicateRecruitingPositionCore);
export const saveRecruitingInterview = method(saveRecruitingInterviewCore);
export const saveRecruitingVetting = method(saveRecruitingVettingCore);
export const saveRecruitingOnboardingTask = method(saveRecruitingOnboardingTaskCore);
export const saveRecruitingTraining = method(saveRecruitingTrainingCore);
export const saveRecruitingHistory = method(saveRecruitingHistoryCore);
export const verifyRecruitingHistory = method(verifyRecruitingHistoryCore);
export const detectRecruitingHistoryGaps = method(detectRecruitingHistoryGapsCore);
export const resolveRecruitingGap = method(resolveRecruitingGapCore);
export const requestRecruitingDocument = method(requestRecruitingDocumentCore);
export const verifyRecruitingDocument = method(verifyRecruitingDocumentCore);
export const createRecruitingDocumentPacket = method(createRecruitingDocumentPacketCore);
export const resendRecruitingDocumentPacket = method(resendRecruitingDocumentPacketCore);
export const saveRecruitingSettings = method(saveRecruitingSettingsCore);
export const testRecruitingIntegrations = method(testRecruitingIntegrationsCore);
export const scheduleRecruitingMaintenance = method(scheduleRecruitingMaintenanceCore);
export const exportRecruitingAudit = method(exportRecruitingAuditCore);
