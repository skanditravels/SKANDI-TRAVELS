import { webMethod, Permissions } from 'wix-web-module';
import { getTravelInfoAdminDataInternal, saveTravelInfoRecordInternal, archiveTravelInfoRecordInternal } from '../helpCenterAdmin.repository.js';

export const getTravelInfoAdminData = webMethod(Permissions.SiteMember, async () => getTravelInfoAdminDataInternal());
export const saveTravelInfoRecord = webMethod(Permissions.SiteMember, async (input = {}) => saveTravelInfoRecordInternal(input));
export const archiveTravelInfoRecord = webMethod(Permissions.SiteMember, async (input = {}) => archiveTravelInfoRecordInternal(input));
