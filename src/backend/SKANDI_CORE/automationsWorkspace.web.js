// SKANDI V12 — authorized Velo web-method boundary for Media Control Email Studio.
import { Permissions, webMethod } from '@wix/web-methods';
import {
  getAutomationWorkspaceCore, saveAutomationTemplateCore, deleteAutomationTemplateCore,
  createAutomationDraftCore, syncAutomationDesignedEmailCore, setAutomationStatusCore,
  getAutomationGraphCore, createAutomationGraphDraftCore,
  openAutomationDraftCore, createBlankAutomationDraftCore, saveAutomationDraftCore,
  validateAutomationDraftCore, publishAutomationDraftCore, deleteAutomationDraftCore,
  deleteAutomationCore, sendAutomationTestEmailCore
} from 'backend/SKANDI_CORE/automationWorkspace';
export const getAutomationWorkspace = webMethod(Permissions.SiteMember, () => getAutomationWorkspaceCore());
export const saveAutomationTemplate = webMethod(Permissions.SiteMember, input => saveAutomationTemplateCore(input));
export const deleteAutomationTemplate = webMethod(Permissions.SiteMember, input => deleteAutomationTemplateCore(input));
export const createAutomationDraft = webMethod(Permissions.SiteMember, input => createAutomationDraftCore(input));
export const syncAutomationDesignedEmail = webMethod(Permissions.SiteMember, input => syncAutomationDesignedEmailCore(input));
export const setAutomationStatus = webMethod(Permissions.SiteMember, input => setAutomationStatusCore(input));

export const getAutomationGraph = webMethod(Permissions.SiteMember, input => getAutomationGraphCore(input));
export const createAutomationGraphDraft = webMethod(Permissions.SiteMember, input => createAutomationGraphDraftCore(input));
export const openAutomationDraft = webMethod(Permissions.SiteMember, input => openAutomationDraftCore(input));
export const createBlankAutomationDraft = webMethod(Permissions.SiteMember, input => createBlankAutomationDraftCore(input));
export const saveAutomationDraft = webMethod(Permissions.SiteMember, input => saveAutomationDraftCore(input));
export const validateAutomationDraft = webMethod(Permissions.SiteMember, input => validateAutomationDraftCore(input));
export const publishAutomationDraft = webMethod(Permissions.SiteMember, input => publishAutomationDraftCore(input));
export const deleteAutomationDraft = webMethod(Permissions.SiteMember, input => deleteAutomationDraftCore(input));
export const deleteAutomation = webMethod(Permissions.SiteMember, input => deleteAutomationCore(input));
export const sendAutomationTestEmail = webMethod(Permissions.SiteMember, input => sendAutomationTestEmailCore(input));
