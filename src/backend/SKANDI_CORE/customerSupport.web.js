// /src/backend/SKANDI_CORE/customerSupport.web.js
// R-007.3 canonical frontend-callable Customer Support + HelpDesk facade.


import { webMethod, Permissions } from "@wix/web-methods";
import {
  getCustomerSupportBootstrapCore,
  getPublicSupportBootstrapCore,
  getSupportWorkflowCore,
  createCustomerSupportCaseCore,
  createPublicSupportCaseCore,
  listCustomerSupportCasesCore,
  getCustomerSupportCaseCore,
  addCustomerSupportMessageCore,
  requestCustomerHumanHandoffCore,
  addCustomerLiveSupportMessageCore,
  startCustomerSupportChatCore,
  sendCustomerSupportChatMessageCore,
  getHumanSupportAvailabilityCore,
  startAlexandraSupportSessionCore,
  getAgentSupportBootstrapCore,
  listAgentSupportCasesCore,
  getAgentSupportCaseCore,
  replyAgentSupportCaseCore,
  updateAgentSupportCaseCore,
  createAgentSupportCaseCore,
  deleteAgentSupportCaseCore,
  getHelpDeskRoutingDecisionCore,
  getStaffHelpDeskBootstrapCore,
  createStaffHelpDeskSupportCaseCore,
  listStaffHelpDeskSupportCasesCore,
  getStaffHelpDeskSupportCaseCore,
  addStaffHelpDeskSupportMessageCore
} from "backend/SKANDI_CORE/customerSupport";


export const getCustomerSupportBootstrap = webMethod(Permissions.Anyone, () => getCustomerSupportBootstrapCore());
export const getPublicSupportBootstrap = webMethod(Permissions.Anyone, (input = {}) => getPublicSupportBootstrapCore(input));
export const getSupportWorkflow = webMethod(Permissions.Anyone, (input = {}) => getSupportWorkflowCore(input));
export const createCustomerSupportCase = webMethod(Permissions.Anyone, (input = {}) => createCustomerSupportCaseCore(input));
export const createPublicSupportCase = webMethod(Permissions.Anyone, (input = {}) => createPublicSupportCaseCore(input));
export const startAlexandraSupportSession = webMethod(Permissions.Anyone, (input = {}) => startAlexandraSupportSessionCore(input));
export const listCustomerSupportCases = webMethod(Permissions.SiteMember, () => listCustomerSupportCasesCore());
export const getCustomerSupportCase = webMethod(Permissions.SiteMember, (input = {}) => getCustomerSupportCaseCore(input));
export const addCustomerSupportMessage = webMethod(Permissions.SiteMember, (input = {}) => addCustomerSupportMessageCore(input));
export const requestCustomerHumanHandoff = webMethod(Permissions.SiteMember, (input = {}) => requestCustomerHumanHandoffCore(input));
export const addCustomerLiveSupportMessage = webMethod(Permissions.SiteMember, (input = {}) => addCustomerLiveSupportMessageCore(input));
export const startCustomerSupportChat = webMethod(Permissions.SiteMember, (input = {}) => startCustomerSupportChatCore(input));
export const sendCustomerSupportChatMessage = webMethod(Permissions.SiteMember, (input = {}) => sendCustomerSupportChatMessageCore(input));
export const getHumanSupportAvailability = webMethod(Permissions.SiteMember, () => getHumanSupportAvailabilityCore());


export const getAgentSupportBootstrap = webMethod(Permissions.SiteMember, () => getAgentSupportBootstrapCore());
export const listAgentSupportCases = webMethod(Permissions.SiteMember, (input = {}) => listAgentSupportCasesCore(input));
export const getAgentSupportCase = webMethod(Permissions.SiteMember, (input = {}) => getAgentSupportCaseCore(input));
export const replyAgentSupportCase = webMethod(Permissions.SiteMember, (input = {}) => replyAgentSupportCaseCore(input));
export const updateAgentSupportCase = webMethod(Permissions.SiteMember, (input = {}) => updateAgentSupportCaseCore(input));
export const createAgentSupportCase = webMethod(Permissions.SiteMember, (input = {}) => createAgentSupportCaseCore(input));
export const deleteAgentSupportCase = webMethod(Permissions.SiteMember, (input = {}) => deleteAgentSupportCaseCore(input));


export const getHelpDeskRoutingDecision = webMethod(Permissions.SiteMember, (input = {}) => getHelpDeskRoutingDecisionCore(input));
export const getStaffHelpDeskBootstrap = webMethod(Permissions.SiteMember, () => getStaffHelpDeskBootstrapCore());
export const createStaffHelpDeskSupportCase = webMethod(Permissions.SiteMember, (input = {}) => createStaffHelpDeskSupportCaseCore(input));
export const listStaffHelpDeskSupportCases = webMethod(Permissions.SiteMember, () => listStaffHelpDeskSupportCasesCore());
export const getStaffHelpDeskSupportCase = webMethod(Permissions.SiteMember, (input = {}) => getStaffHelpDeskSupportCaseCore(input));
export const addStaffHelpDeskSupportMessage = webMethod(Permissions.SiteMember, (input = {}) => addStaffHelpDeskSupportMessageCore(input));
