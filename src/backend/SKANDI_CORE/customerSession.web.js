// /src/backend/SKANDI_CORE/customerSession.web.js
// SKANDI Backend Base 1.0 — customer header/footer web-method boundary.

import { Permissions, webMethod } from "@wix/web-methods";
import {
  getCustomerHeaderSessionCore,
  subscribeCustomerNewsletterCore
} from "backend/SKANDI_CORE/customerSession.js";

export const getCustomerHeaderSession = webMethod(
  Permissions.SiteMember,
  getCustomerHeaderSessionCore
);

export const subscribeCustomerNewsletter = webMethod(
  Permissions.Anyone,
  subscribeCustomerNewsletterCore
);
