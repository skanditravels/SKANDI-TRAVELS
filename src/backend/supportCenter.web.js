// /src/backend/supportCenter.web.js
// SKANDI Support Center — provider-neutral canonical web facade.
// R-003.7
// Supabase owns identity/history; LiveKit owns realtime transport.

import { webMethod, Permissions } from "wix-web-module";
import {
  getPublicSupportBootstrapCore,
  createPublicSupportCaseCore,
  getCustomerSupportBootstrapCore,
  createCustomerSupportCaseCore,
  listCustomerSupportCasesCore,
  getCustomerSupportCaseCore,
  addCustomerSupportMessageCore,
  startCustomerSupportChatCore,
  sendCustomerSupportChatMessageCore,
  getAgentSupportBootstrapCore,
  listAgentSupportCasesCore,
  getAgentSupportCaseCore,
  replyAgentSupportCaseCore,
  updateAgentSupportCaseCore,
  createAgentSupportCaseCore,
  deleteAgentSupportCaseCore
} from "./SKANDI_CORE/customerSupport.js";

export const getPublicSupportBootstrap = webMethod(Permissions.Anyone, async payload => getPublicSupportBootstrapCore(payload || {}));
export const createPublicSupportCase = webMethod(Permissions.Anyone, async payload => createPublicSupportCaseCore(payload || {}));

export const getCustomerSupportBootstrap = webMethod(Permissions.SiteMember, async payload => getCustomerSupportBootstrapCore(payload || {}));
export const createCustomerSupportCase = webMethod(Permissions.SiteMember, async payload => createCustomerSupportCaseCore(payload || {}));
export const listCustomerSupportCases = webMethod(Permissions.SiteMember, async payload => listCustomerSupportCasesCore(payload || {}));
export const getCustomerSupportCase = webMethod(Permissions.SiteMember, async payload => getCustomerSupportCaseCore(payload || {}));
export const addCustomerSupportMessage = webMethod(Permissions.SiteMember, async payload => addCustomerSupportMessageCore(payload || {}));
export const startCustomerSupportChat = webMethod(Permissions.SiteMember, async payload => startCustomerSupportChatCore(payload || {}));
export const sendCustomerSupportChatMessage = webMethod(Permissions.SiteMember, async payload => sendCustomerSupportChatMessageCore(payload || {}));

export const getAgentSupportBootstrap = webMethod(Permissions.SiteMember, async payload => getAgentSupportBootstrapCore(payload || {}));
export const listAgentSupportCases = webMethod(Permissions.SiteMember, async payload => listAgentSupportCasesCore(payload || {}));
export const getAgentSupportCase = webMethod(Permissions.SiteMember, async payload => getAgentSupportCaseCore(payload || {}));
export const replyAgentSupportCase = webMethod(Permissions.SiteMember, async payload => replyAgentSupportCaseCore(payload || {}));
export const updateAgentSupportCase = webMethod(Permissions.SiteMember, async payload => updateAgentSupportCaseCore(payload || {}));
export const createAgentSupportCase = webMethod(Permissions.SiteMember, async payload => createAgentSupportCaseCore(payload || {}));
export const deleteAgentSupportCase = webMethod(Permissions.SiteMember, async payload => deleteAgentSupportCaseCore(payload || {}));
