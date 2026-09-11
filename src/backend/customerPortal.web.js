// /src/backend/customerPortal.web.js
// SKANDI My Profile — thin web-method facade over SKANDI_CORE/customerProfile.js.
// R-003.7

import { webMethod, Permissions } from "wix-web-module";
import {
  getCustomerPortalStateCore,
  saveCustomerProfileCore,
  saveTravelCompanionCore,
  deleteTravelCompanionCore,
  saveTravelDocumentCore,
  deleteTravelDocumentCore,
  saveCustomerPreferenceCore,
  enrollCustomerClubCore,
  saveCustomerCommunicationCore,
  getCustomerAirportDirectoryCore,
  redeemCustomerRewardCore
} from "./SKANDI_CORE/customerProfile.js";

export const getCustomerPortalState = webMethod(Permissions.SiteMember, async () => getCustomerPortalStateCore());
export const saveCustomerProfile = webMethod(Permissions.SiteMember, async payload => saveCustomerProfileCore(payload || {}));
export const saveTravelCompanion = webMethod(Permissions.SiteMember, async payload => saveTravelCompanionCore(payload || {}));
export const deleteTravelCompanion = webMethod(Permissions.SiteMember, async id => deleteTravelCompanionCore(id));
export const saveTravelDocument = webMethod(Permissions.SiteMember, async payload => saveTravelDocumentCore(payload || {}));
export const deleteTravelDocument = webMethod(Permissions.SiteMember, async id => deleteTravelDocumentCore(id));
export const saveCustomerPreferences = webMethod(Permissions.SiteMember, async payload => saveCustomerPreferenceCore(payload || {}));
export const enrollCustomerClub = webMethod(Permissions.SiteMember, async payload => enrollCustomerClubCore(payload || {}));
export const saveCustomerCommunication = webMethod(Permissions.SiteMember, async payload => saveCustomerCommunicationCore(payload || {}));
export const getCustomerAirportDirectory = webMethod(Permissions.SiteMember, async () => getCustomerAirportDirectoryCore());
export const redeemWixLoyaltyReward = webMethod(Permissions.SiteMember, async payload => redeemCustomerRewardCore(payload || {}));
