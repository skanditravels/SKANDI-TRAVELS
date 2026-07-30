import { webMethod, Permissions } from 'wix-web-module';
import { getHelpCenterAdminDataInternal, saveHelpCenterGroupInternal, saveHelpCenterTopicInternal, archiveHelpCenterGroupInternal, archiveHelpCenterTopicInternal } from '../helpCenterAdmin.repository.js';

export const getHelpCenterAdminData = webMethod(Permissions.SiteMember, async () => getHelpCenterAdminDataInternal());
export const saveHelpCenterGroup = webMethod(Permissions.SiteMember, async (input = {}) => saveHelpCenterGroupInternal(input));
export const saveHelpCenterTopic = webMethod(Permissions.SiteMember, async (input = {}) => saveHelpCenterTopicInternal(input));
export const archiveHelpCenterGroup = webMethod(Permissions.SiteMember, async (input = {}) => archiveHelpCenterGroupInternal(input));
export const archiveHelpCenterTopic = webMethod(Permissions.SiteMember, async (input = {}) => archiveHelpCenterTopicInternal(input));
