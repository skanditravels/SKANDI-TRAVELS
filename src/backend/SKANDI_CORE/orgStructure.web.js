// /src/backend/SKANDI_CORE/orgStructure.web.js
// SKANDI SuccessFactors v12 — canonical Wix web-method boundary.
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
  saveSuccessFactorsPortalStateCore,
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

export const getSuccessFactorsPortalBootstrap = webMethod(MEMBER, async () => {
  return getSuccessFactorsPortalBootstrapCore();
});

export const getSuccessFactorsDirectory = webMethod(MEMBER, async (payload) => {
  return getSuccessFactorsDirectoryCore(input(payload));
});

export const saveSuccessFactorsSelfProfile = webMethod(MEMBER, async (payload) => {
  return saveSuccessFactorsSelfProfileCore(input(payload));
});

export const getOrgStructureBootstrap = webMethod(MEMBER, async (payload) => {
  return getOrgStructureBootstrapCore(input(payload));
});

export const getEmployeeWorkspace = webMethod(MEMBER, async (payload) => {
  return getEmployeeWorkspaceCore(input(payload));
});

export const getManagerCandidates = webMethod(MEMBER, async (payload) => {
  return getManagerCandidatesCore(input(payload));
});

export const provisionStaffOrganization = webMethod(MEMBER, async (payload) => {
  return provisionStaffOrganizationCore(input(payload));
});

export const generateEmployeeSkId = webMethod(MEMBER, async (payload) => {
  return generateEmployeeSkIdCore(input(payload));
});

export const createEmployee = webMethod(MEMBER, async (payload) => {
  return createEmployeeCore(input(payload));
});

export const updateEmployee = webMethod(MEMBER, async (payload) => {
  return updateEmployeeCore(input(payload));
});

export const setEmployeeActive = webMethod(MEMBER, async (payload) => {
  return setEmployeeActiveCore(input(payload));
});

export const provisionEmployeeWixMember = webMethod(MEMBER, async (payload) => {
  return provisionEmployeeWixMemberCore(input(payload));
});

export const getBadgeControl = webMethod(MEMBER, async (payload) => {
  return getBadgeControlCore(input(payload));
});

export const saveBadgeControl = webMethod(MEMBER, async (payload) => {
  return saveBadgeControlCore(input(payload));
});

export const getRecruitingBootstrap = webMethod(MEMBER, async (payload) => {
  return getRecruitingBootstrapCore(input(payload));
});

export const saveRecruitingCandidate = webMethod(MEMBER, async (payload) => {
  return saveRecruitingCandidateCore(input(payload));
});

export const updateRecruitingCandidateStage = webMethod(MEMBER, async (payload) => {
  return updateRecruitingCandidateStageCore(input(payload));
});

export const saveRecruitingPosition = webMethod(MEMBER, async (payload) => {
  return saveRecruitingPositionCore(input(payload));
});

export const publishRecruitingPosition = webMethod(MEMBER, async (payload) => {
  return publishRecruitingPositionCore(input(payload));
});

export const duplicateRecruitingPosition = webMethod(MEMBER, async (payload) => {
  return duplicateRecruitingPositionCore(input(payload));
});

export const saveRecruitingInterview = webMethod(MEMBER, async (payload) => {
  return saveRecruitingInterviewCore(input(payload));
});

export const saveRecruitingVetting = webMethod(MEMBER, async (payload) => {
  return saveRecruitingVettingCore(input(payload));
});

export const saveRecruitingOnboardingTask = webMethod(MEMBER, async (payload) => {
  return saveRecruitingOnboardingTaskCore(input(payload));
});

export const saveRecruitingTraining = webMethod(MEMBER, async (payload) => {
  return saveRecruitingTrainingCore(input(payload));
});

export const saveRecruitingHistory = webMethod(MEMBER, async (payload) => {
  return saveRecruitingHistoryCore(input(payload));
});

export const verifyRecruitingHistory = webMethod(MEMBER, async (payload) => {
  return verifyRecruitingHistoryCore(input(payload));
});

export const detectRecruitingHistoryGaps = webMethod(MEMBER, async (payload) => {
  return detectRecruitingHistoryGapsCore(input(payload));
});

export const resolveRecruitingGap = webMethod(MEMBER, async (payload) => {
  return resolveRecruitingGapCore(input(payload));
});

export const requestRecruitingDocument = webMethod(MEMBER, async (payload) => {
  return requestRecruitingDocumentCore(input(payload));
});

export const verifyRecruitingDocument = webMethod(MEMBER, async (payload) => {
  return verifyRecruitingDocumentCore(input(payload));
});

export const createRecruitingDocumentPacket = webMethod(MEMBER, async (payload) => {
  return createRecruitingDocumentPacketCore(input(payload));
});

export const resendRecruitingDocumentPacket = webMethod(MEMBER, async (payload) => {
  return resendRecruitingDocumentPacketCore(input(payload));
});

export const saveRecruitingSettings = webMethod(MEMBER, async (payload) => {
  return saveRecruitingSettingsCore(input(payload));
});

export const testRecruitingIntegrations = webMethod(MEMBER, async (payload) => {
  return testRecruitingIntegrationsCore(input(payload));
});

export const scheduleRecruitingMaintenance = webMethod(MEMBER, async (payload) => {
  return scheduleRecruitingMaintenanceCore(input(payload));
});

export const exportRecruitingAudit = webMethod(MEMBER, async (payload) => {
  return exportRecruitingAuditCore(input(payload));
});

export const saveSuccessFactorsPortalState = webMethod(MEMBER, async (payload) => {
  return saveSuccessFactorsPortalStateCore(input(payload));
});
