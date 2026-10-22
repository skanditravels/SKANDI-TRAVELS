// /src/backend/SKANDI_CORE/customerSupport.web.js
// SKANDI Customer Support v12 — canonical frontend-callable Customer Support, Alexandra and HelpDesk facade.
// Public Travel Info support requests use createPublicSupportCase through this shared boundary.
// Business rules, persistence and realtime-provider ownership remain in the canonical customer support core.


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
import { startAlexandraAiSessionCore, answerAlexandraAiMessageCore } from "backend/SKANDI_CORE/alexandraWixAi";
import { startAlexandraSupportSessionCore } from "backend/SKANDI_CORE/customerSupport";
import { replyAgentWhatsAppCore } from "backend/SKANDI_CORE/whatsAppCustomerCare";


export const getCustomerSupportBootstrap = webMethod(Permissions.Anyone, () => getCustomerSupportBootstrapCore());
export const getPublicSupportBootstrap = webMethod(Permissions.Anyone, (input = {}) => getPublicSupportBootstrapCore(input));
export const getSupportWorkflow = webMethod(Permissions.Anyone, (input = {}) => getSupportWorkflowCore(input));
export const createCustomerSupportCase = webMethod(Permissions.Anyone, (input = {}) => createCustomerSupportCaseCore(input));
export const createPublicSupportCase = webMethod(Permissions.Anyone, (input = {}) => createPublicSupportCaseCore(input));
// Preserve the existing Wix AI facade for the dedicated /about/support page.
export const startAlexandraSupportSession = webMethod(Permissions.Anyone, () => startAlexandraAiSessionCore());
// Sitewide desktop and mobile Alexandra share the established canonical LiveKit dispatch core.
export const startAlexandraLiveKitSession = webMethod(Permissions.Anyone, (input = {}) => startAlexandraSupportSessionCore(input));
export const sendAlexandraAiMessage = webMethod(Permissions.Anyone, (input = {}) => answerAlexandraAiMessageCore(input));
export const listCustomerSupportCases = webMethod(Permissions.SiteMember, () => listCustomerSupportCasesCore());
// Customer-facing responses must never expose internal agent notes, supplier audit
// events or Booking Team handoff summaries. Agent methods remain unchanged.
export const getCustomerSupportCase = webMethod(Permissions.SiteMember, async (input = {}) => {
  const detail = await getCustomerSupportCaseCore(input);
  return { ...detail, messages: (Array.isArray(detail?.messages) ? detail.messages : []).filter(message => message?.private !== true && message?.kind !== "internal" && String(message?.channel || "").toLowerCase() !== "internal") };
});
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
export const replyAgentWhatsApp = webMethod(Permissions.SiteMember, (input = {}) => replyAgentWhatsAppCore(input));
export const updateAgentSupportCase = webMethod(Permissions.SiteMember, (input = {}) => updateAgentSupportCaseCore(input));
export const createAgentSupportCase = webMethod(Permissions.SiteMember, (input = {}) => createAgentSupportCaseCore(input));
export const deleteAgentSupportCase = webMethod(Permissions.SiteMember, (input = {}) => deleteAgentSupportCaseCore(input));


export const getHelpDeskRoutingDecision = webMethod(Permissions.SiteMember, (input = {}) => getHelpDeskRoutingDecisionCore(input));
export const getStaffHelpDeskBootstrap = webMethod(Permissions.SiteMember, () => getStaffHelpDeskBootstrapCore());
export const createStaffHelpDeskSupportCase = webMethod(Permissions.SiteMember, (input = {}) => createStaffHelpDeskSupportCaseCore(input));
export const listStaffHelpDeskSupportCases = webMethod(Permissions.SiteMember, () => listStaffHelpDeskSupportCasesCore());
export const getStaffHelpDeskSupportCase = webMethod(Permissions.SiteMember, (input = {}) => getStaffHelpDeskSupportCaseCore(input));
export const addStaffHelpDeskSupportMessage = webMethod(Permissions.SiteMember, (input = {}) => addStaffHelpDeskSupportMessageCore(input));
