// SKANDI V12 — authorized Velo web-method boundary for Media Control Email Studio.
import { Permissions, webMethod } from '@wix/web-methods';
import {
  getAutomationWorkspaceCore, saveAutomationTemplateCore, deleteAutomationTemplateCore,
  createAutomationDraftCore, syncAutomationDesignedEmailCore, setAutomationStatusCore,
  getAutomationGraphCore, createAutomationGraphDraftCore
} from 'backend/SKANDI_CORE/automationWorkspace';
export const getAutomationWorkspace = webMethod(Permissions.SiteMember, () => getAutomationWorkspaceCore());
export const saveAutomationTemplate = webMethod(Permissions.SiteMember, input => saveAutomationTemplateCore(input));
export const deleteAutomationTemplate = webMethod(Permissions.SiteMember, input => deleteAutomationTemplateCore(input));
export const createAutomationDraft = webMethod(Permissions.SiteMember, input => createAutomationDraftCore(input));
export const syncAutomationDesignedEmail = webMethod(Permissions.SiteMember, input => syncAutomationDesignedEmailCore(input));
export const setAutomationStatus = webMethod(Permissions.SiteMember, input => setAutomationStatusCore(input));

export const getAutomationGraph = webMethod(Permissions.SiteMember, input => getAutomationGraphCore(input));
export const createAutomationGraphDraft = webMethod(Permissions.SiteMember, input => createAutomationGraphDraftCore(input));
