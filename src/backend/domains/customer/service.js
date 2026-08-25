// backend/domains/customer/service.js
// Compatibility facade. Customer support domain operations live in ../support/service.js.

export {
  createCase,
  listCustomerCases,
  listAgentCases,
  getAgentCase,
  replyAgentCase,
  updateAgentCase
} from "../support/service.js";
